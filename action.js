// ShutUpLinkedIn - DOM Action Layer
// Handles hiding posts, showing replacements, and user interactions

class PostAction {
  constructor() {
    this.hiddenPosts = new Map(); // Track hidden posts
    this.feedbackData = new Map(); // Store user feedback
    this.stats = {
      hidden: 0,
      revealed: 0,
      feedback: 0
    };

    this.loadFeedbackData();
  }

  /**
   * Hides a post and shows replacement element
   */
  hidePost(postElement, score, preview, reasons = []) {
    // Add hidden class
    postElement.classList.add('shutup-hidden');

    // Generate unique ID for this post
    const postId = this.generatePostId(postElement);

    // Create replacement element
    const replacement = this.createReplacementElement(postId, score, preview, reasons);

    // Insert replacement before the original post
    postElement.parentNode.insertBefore(replacement, postElement);

    // Store reference
    this.hiddenPosts.set(postId, {
      originalElement: postElement,
      replacementElement: replacement,
      score: score,
      preview: preview,
      hiddenAt: Date.now()
    });

    // Update stats
    this.stats.hidden++;
    this.saveStats();

    console.log(`ShutUpLinkedIn: Hidden post ${postId} with score ${score.toFixed(1)}: "${preview}"`);

    return postId;
  }

  /**
   * Creates the replacement element shown instead of hidden posts
   */
  createReplacementElement(postId, score, preview, reasons = []) {
    const replacement = document.createElement('div');
    replacement.className = 'shutup-replacement';
    replacement.dataset.postId = postId;

    // Create reason tags if provided
    const reasonTags = reasons.length > 0
      ? `<div class="shutup-reasons">${reasons.map(r => `<span class="shutup-reason-tag">${r}</span>`).join('')}</div>`
      : '';

    replacement.innerHTML = `
      <div class="shutup-info">
        <span class="shutup-icon">🤫</span>
        <span class="shutup-text">Hidden low-value post (score: ${score.toFixed(1)})</span>
        <button class="shutup-show" data-post-id="${postId}">Show anyway</button>
      </div>
      ${reasonTags}
      <div class="shutup-preview">"${this.sanitizePreview(preview)}..."</div>
      <div class="shutup-feedback">
        <button class="shutup-feedback-btn" data-post-id="${postId}" data-feedback="correct">👍 Correctly hidden</button>
        <button class="shutup-feedback-btn" data-post-id="${postId}" data-feedback="incorrect">👎 Shouldn't be hidden</button>
      </div>
    `;

    // Bind event handlers
    this.bindReplacementEvents(replacement);

    return replacement;
  }

  /**
   * Binds event handlers to replacement element buttons
   */
  bindReplacementEvents(replacement) {
    // Show button
    const showButton = replacement.querySelector('.shutup-show');
    if (showButton) {
      showButton.addEventListener('click', (e) => {
        const postId = e.target.dataset.postId;
        this.revealPost(postId);
      });
    }

    // Feedback buttons
    const feedbackButtons = replacement.querySelectorAll('.shutup-feedback-btn');
    feedbackButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const postId = e.target.dataset.postId;
        const feedback = e.target.dataset.feedback;
        this.recordFeedback(postId, feedback);
        this.updateFeedbackUI(e.target, feedback);
      });
    });
  }

  /**
   * Reveals a hidden post
   */
  revealPost(postId) {
    const hiddenPost = this.hiddenPosts.get(postId);
    if (!hiddenPost) return;

    // Show original post
    hiddenPost.originalElement.classList.remove('shutup-hidden');

    // Remove replacement
    if (hiddenPost.replacementElement.parentNode) {
      hiddenPost.replacementElement.parentNode.removeChild(hiddenPost.replacementElement);
    }

    // Update tracking
    this.hiddenPosts.delete(postId);
    this.stats.revealed++;
    this.saveStats();

    console.log(`ShutUpLinkedIn: Revealed post ${postId}`);
  }

  /**
   * Records user feedback on filtering decisions
   */
  recordFeedback(postId, feedback) {
    const hiddenPost = this.hiddenPosts.get(postId);
    if (!hiddenPost) return;

    const feedbackEntry = {
      postId: postId,
      feedback: feedback, // 'correct' or 'incorrect'
      score: hiddenPost.score,
      preview: hiddenPost.preview,
      timestamp: Date.now()
    };

    this.feedbackData.set(postId, feedbackEntry);
    this.stats.feedback++;

    // Save to localStorage
    this.saveFeedbackData();
    this.saveStats();

    console.log(`ShutUpLinkedIn: Recorded feedback for post ${postId}: ${feedback}`);
  }

  /**
   * Updates feedback button UI after user interaction
   */
  updateFeedbackUI(clickedButton, feedback) {
    const feedbackContainer = clickedButton.parentNode;
    const buttons = feedbackContainer.querySelectorAll('.shutup-feedback-btn');

    // Reset all buttons
    buttons.forEach(btn => {
      btn.classList.remove('selected');
      btn.disabled = false;
    });

    // Highlight selected button
    clickedButton.classList.add('selected');
    clickedButton.disabled = true;

    // Show thank you message
    setTimeout(() => {
      const thankYou = document.createElement('span');
      thankYou.className = 'shutup-thanks';
      thankYou.textContent = '✅ Thanks for the feedback!';
      feedbackContainer.appendChild(thankYou);

      setTimeout(() => {
        if (thankYou.parentNode) {
          thankYou.parentNode.removeChild(thankYou);
        }
      }, 3000);
    }, 500);
  }

  /**
   * Generates a unique ID for a post element
   */
  generatePostId(postElement) {
    // Try to get LinkedIn's data-urn first
    const urn = postElement.dataset.urn || postElement.getAttribute('data-urn');
    if (urn) {
      return urn.replace(/[^a-zA-Z0-9]/g, '-');
    }

    // Fallback to content-based hash
    const content = postElement.textContent || '';
    const hash = this.simpleHash(content.substring(0, 100));
    return `post-${hash}-${Date.now()}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Sanitizes preview text for safe HTML insertion
   */
  sanitizePreview(text) {
    return text
      .replace(/[<>&"']/g, (char) => {
        const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
        return entities[char];
      })
      .substring(0, 100);
  }

  /**
   * Loads feedback data from localStorage
   */
  async loadFeedbackData() {
    try {
      const stored = await chrome.storage.local.get(['shutup_feedback', 'shutup_stats']);

      if (stored.shutup_feedback) {
        this.feedbackData = new Map(Object.entries(stored.shutup_feedback));
      }

      if (stored.shutup_stats) {
        this.stats = { ...this.stats, ...stored.shutup_stats };
      }
    } catch (error) {
      console.log('ShutUpLinkedIn: Could not load feedback data');
    }
  }

  /**
   * Saves feedback data to localStorage
   */
  async saveFeedbackData() {
    try {
      const feedbackObj = Object.fromEntries(this.feedbackData);
      await chrome.storage.local.set({ shutup_feedback: feedbackObj });
    } catch (error) {
      console.log('ShutUpLinkedIn: Could not save feedback data');
    }
  }

  /**
   * Saves stats to storage
   */
  async saveStats() {
    try {
      await chrome.storage.local.set({ shutup_stats: this.stats });
      await chrome.storage.sync.set({ hiddenCount: this.stats.hidden });
    } catch (error) {
      console.log('ShutUpLinkedIn: Could not save stats');
    }
  }

  /**
   * Gets feedback statistics for analysis
   */
  getFeedbackStats() {
    const correct = Array.from(this.feedbackData.values()).filter(f => f.feedback === 'correct').length;
    const incorrect = Array.from(this.feedbackData.values()).filter(f => f.feedback === 'incorrect').length;

    return {
      total: this.feedbackData.size,
      correct: correct,
      incorrect: incorrect,
      accuracy: this.feedbackData.size > 0 ? (correct / this.feedbackData.size) * 100 : 0,
      ...this.stats
    };
  }

  /**
   * Gets recently hidden posts for debugging
   */
  getRecentlyHidden(limit = 5) {
    return Array.from(this.hiddenPosts.values())
      .sort((a, b) => b.hiddenAt - a.hiddenAt)
      .slice(0, limit)
      .map(post => ({
        score: post.score,
        preview: post.preview,
        hiddenAt: new Date(post.hiddenAt).toLocaleString()
      }));
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostAction;
}
