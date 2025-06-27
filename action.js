// ShutUpLinkedIn - DOM Action Layer
// Handles hiding posts, showing replacements, and user interactions

class PostAction {
  constructor() {
    this.hiddenPosts = new Map(); // Track hidden posts
    this.revealedPosts = new Map(); // Track revealed posts that can be re-hidden
    this.feedbackData = new Map(); // Store user feedback
    this.whitelist = new Set(); // Track whitelisted authors
    this.stats = {
      hidden: 0,
      revealed: 0,
      feedback: 0
    };

    this.loadFeedbackData();
    this.loadWhitelist();
  }

  /**
   * Hides a post and shows replacement element
   */
  hidePost(postElement, score, preview, reasons = []) {
    // Add hidden class
    postElement.classList.add('shutup-hidden');

    // Generate unique ID for this post
    const postId = this.generatePostId(postElement);

    // Extract author information
    const authorInfo = this.extractAuthorInfo(postElement);

    // Create replacement element
    const replacement = this.createReplacementElement(postId, score, preview, reasons, authorInfo);

    // Insert replacement before the original post
    postElement.parentNode.insertBefore(replacement, postElement);

    // Store reference
    this.hiddenPosts.set(postId, {
      originalElement: postElement,
      replacementElement: replacement,
      score: score,
      preview: preview,
      authorInfo: authorInfo,
      hiddenAt: Date.now()
    });

    // Remove from revealed posts if it was there
    this.revealedPosts.delete(postId);

    // Update stats
    this.stats.hidden++;
    this.saveStats();

    console.log(`ShutUpLinkedIn: Hidden post ${postId} with score ${score.toFixed(1)}: "${preview}"`);

    return postId;
  }

  /**
   * Creates the replacement element shown instead of hidden posts
   */
  createReplacementElement(postId, score, preview, reasons = [], authorInfo = {}) {
    const replacement = document.createElement('div');
    replacement.className = 'shutup-replacement shutup-replacement--author';
    replacement.dataset.postId = postId;

    // Use author info if available, fallback to default
    const authorImage = authorInfo.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6.627 0-12 2.686-12 6v2h24v-2c0-3.314-5.373-6-12-6z"/></svg>';
    const authorName = authorInfo.name || 'Unknown Author';
    const authorTitle = authorInfo.title || '';

    replacement.innerHTML = `
      <div class="shutup-author-info">
        <img src="${authorImage}" class="shutup-author-avatar" alt="${authorName}">
        <div class="shutup-author-details">
          <div class="shutup-author-name">${this.sanitizeText(authorName)}</div>
          ${authorTitle ? `<div class="shutup-author-title">${this.sanitizeText(authorTitle)}</div>` : ''}
        </div>
        <div class="shutup-menu-container">
          <button class="shutup-menu-trigger" data-post-id="${postId}" title="Post options">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            </svg>
          </button>
          <div class="shutup-menu-dropdown" data-post-id="${postId}">
            <div class="shutup-menu-item" data-action="show" data-post-id="${postId}">
              <span class="shutup-menu-icon">👁️</span>
              Show post
            </div>
            <div class="shutup-menu-item" data-action="details" data-post-id="${postId}">
              <span class="shutup-menu-icon">ℹ️</span>
              Why hidden? (${score.toFixed(1)})
            </div>
            <div class="shutup-menu-item" data-action="whitelist" data-post-id="${postId}">
              <span class="shutup-menu-icon">✅</span>
              Never hide ${authorName.split(' ')[0]}
            </div>
            <div class="shutup-menu-divider"></div>
            <div class="shutup-menu-item" data-action="feedback-correct" data-post-id="${postId}">
              <span class="shutup-menu-icon">👍</span>
              Correctly hidden
            </div>
            <div class="shutup-menu-item" data-action="feedback-incorrect" data-post-id="${postId}">
              <span class="shutup-menu-icon">👎</span>
              Shouldn't be hidden
            </div>
          </div>
        </div>
      </div>
      <div class="shutup-details-panel" data-post-id="${postId}" style="display: none;">
        <div class="shutup-details-content">
          <strong>Score: ${score.toFixed(1)}</strong><br>
          <strong>Reasons:</strong> ${reasons.join(', ') || 'Pattern detection'}<br>
          <strong>Preview:</strong> "${this.sanitizeText(preview.substring(0, 80))}..."
        </div>
      </div>
    `;

    // Bind event handlers
    this.bindAuthorReplacementEvents(replacement);

    return replacement;
  }

  /**
   * Creates a re-hide button for revealed posts
   */
  createReHideButton(postId) {
    const button = document.createElement('button');
    button.className = 'shutup-rehide-btn';
    button.dataset.postId = postId;
    button.title = 'Hide this post again';
    button.innerHTML = '🤫';

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.reHidePost(postId);
    });

    return button;
  }

  /**
   * Extracts author information from a post element
   */
  extractAuthorInfo(postElement) {
    const authorInfo = {};

    // Try to find author name
    const nameSelectors = [
      '.update-components-actor__name',
      '.update-components-actor__title',
      '.feed-shared-actor__name',
      '.update-components-actor__meta-link',
      '.actor-name'
    ];

    for (const selector of nameSelectors) {
      const nameElement = postElement.querySelector(selector);
      if (nameElement) {
        authorInfo.name = nameElement.textContent?.trim();
        if (authorInfo.name) break;
      }
    }

    // Try to find author image
    const imageSelectors = [
      '.update-components-actor__avatar img',
      '.feed-shared-actor__avatar img',
      '.update-components-actor img',
      '.actor-image img'
    ];

    for (const selector of imageSelectors) {
      const imageElement = postElement.querySelector(selector);
      if (imageElement && imageElement.src) {
        authorInfo.image = imageElement.src;
        break;
      }
    }

    // Try to find author title/description
    const titleSelectors = [
      '.update-components-actor__description',
      '.feed-shared-actor__description',
      '.actor-description'
    ];

    for (const selector of titleSelectors) {
      const titleElement = postElement.querySelector(selector);
      if (titleElement) {
        authorInfo.title = titleElement.textContent?.trim();
        if (authorInfo.title) break;
      }
    }

    return authorInfo;
  }

  /**
   * Sanitizes text for safe HTML insertion
   */
  sanitizeText(text) {
    if (!text) return '';
    return text
      .replace(/[<>&"']/g, (char) => {
        const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
        return entities[char];
      });
  }

  /**
   * Binds event handlers to author replacement element
   */
  bindAuthorReplacementEvents(replacement) {
    const menuTrigger = replacement.querySelector('.shutup-menu-trigger');
    const menuDropdown = replacement.querySelector('.shutup-menu-dropdown');
    const menuItems = replacement.querySelectorAll('.shutup-menu-item');

    // Toggle dropdown menu
    if (menuTrigger) {
      menuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu(menuDropdown);
      });
    }

    // Handle menu item clicks
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        const postId = e.currentTarget.dataset.postId;
        this.handleMenuAction(action, postId, replacement);
        this.closeMenu(menuDropdown);
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!replacement.contains(e.target)) {
        this.closeMenu(menuDropdown);
      }
    });
  }

  /**
   * Toggles the dropdown menu
   */
  toggleMenu(menuDropdown) {
    // Close all other open menus first
    document.querySelectorAll('.shutup-menu-dropdown.open').forEach(menu => {
      if (menu !== menuDropdown) {
        menu.classList.remove('open');
      }
    });

    menuDropdown.classList.toggle('open');
  }

  /**
   * Closes a dropdown menu
   */
  closeMenu(menuDropdown) {
    menuDropdown.classList.remove('open');
  }

  /**
   * Handles menu action clicks
   */
  handleMenuAction(action, postId, replacement) {
    const hiddenPost = this.hiddenPosts.get(postId);
    if (!hiddenPost) return;

    switch (action) {
      case 'show':
        this.revealPost(postId);
        break;
      case 'details':
        this.toggleDetailsPanel(postId, replacement);
        break;
      case 'whitelist':
        this.whitelistAuthor(hiddenPost.authorInfo, postId);
        break;
      case 'feedback-correct':
        this.recordFeedback(postId, 'correct');
        this.showFeedbackConfirmation(replacement, 'Thanks for the feedback!');
        break;
      case 'feedback-incorrect':
        this.recordFeedback(postId, 'incorrect');
        this.showFeedbackConfirmation(replacement, 'Noted. We\'ll improve.');
        break;
    }
  }

  /**
   * Toggles the details panel
   */
  toggleDetailsPanel(postId, replacement) {
    const detailsPanel = replacement.querySelector('.shutup-details-panel');
    if (detailsPanel) {
      const isVisible = detailsPanel.style.display !== 'none';
      detailsPanel.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * Shows feedback confirmation
   */
  showFeedbackConfirmation(replacement, message) {
    const authorDetails = replacement.querySelector('.shutup-author-details');
    const originalContent = authorDetails.innerHTML;

    authorDetails.innerHTML = `<div class="shutup-feedback-message">✓ ${message}</div>`;

    setTimeout(() => {
      authorDetails.innerHTML = originalContent;
    }, 2000);
  }

  /**
   * Updates compact feedback button UI after user interaction
   */
  updateCompactFeedbackUI(clickedButton, feedback) {
    const replacement = clickedButton.closest('.shutup-replacement');
    const feedbackButtons = replacement.querySelectorAll('.shutup-feedback-compact');

    // Reset all feedback buttons
    feedbackButtons.forEach(btn => {
      btn.classList.remove('selected');
      btn.disabled = false;
    });

    // Highlight selected button
    clickedButton.classList.add('selected');
    clickedButton.disabled = true;

    // Show brief confirmation
    const textElement = replacement.querySelector('.shutup-compact-text');
    const originalText = textElement.textContent;
    textElement.textContent = feedback === 'correct' ? 'Thanks! ✓' : 'Noted ✓';

    setTimeout(() => {
      textElement.textContent = originalText;
      clickedButton.classList.remove('selected');
      clickedButton.disabled = false;
    }, 2000);
  }

  /**
   * Reveals a hidden post and adds re-hide button
   */
  revealPost(postId) {
    const hiddenPost = this.hiddenPosts.get(postId);
    if (!hiddenPost) {
      console.warn(`ShutUpLinkedIn: Attempted to reveal non-existent post ${postId}`);
      return;
    }

    // Check if post is already revealed to prevent duplicates
    if (this.revealedPosts.has(postId)) {
      console.warn(`ShutUpLinkedIn: Post ${postId} is already revealed`);
      return;
    }

    // Show original post
    hiddenPost.originalElement.classList.remove('shutup-hidden');

    // Remove replacement
    if (hiddenPost.replacementElement.parentNode) {
      hiddenPost.replacementElement.parentNode.removeChild(hiddenPost.replacementElement);
    }

    // Add re-hide button to the post
    const reHideButton = this.createReHideButton(postId);
    this.addReHideButtonToPost(hiddenPost.originalElement, reHideButton);

    // Move from hidden to revealed tracking
    this.revealedPosts.set(postId, {
      originalElement: hiddenPost.originalElement,
      reHideButton: reHideButton,
      score: hiddenPost.score,
      preview: hiddenPost.preview,
      revealedAt: Date.now()
    });

    this.hiddenPosts.delete(postId);
    this.stats.revealed++;
    this.saveStats();

    console.log(`ShutUpLinkedIn: Revealed post ${postId}`);
  }

  /**
   * Adds the re-hide button to the post's control menu area
   */
  addReHideButtonToPost(postElement, reHideButton) {
    // Check if a re-hide button already exists and remove it to prevent duplicates
    const existingButtons = postElement.querySelectorAll('.shutup-rehide-btn');
    existingButtons.forEach(btn => {
      if (btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });

    // Also remove any existing containers
    const existingContainers = postElement.querySelectorAll('.shutup-rehide-container');
    existingContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    // Find the control menu area (where the three dots and hide button are)
    const controlMenu = postElement.querySelector('.feed-shared-control-menu');

    if (controlMenu) {
      // Add our button to the control menu
      controlMenu.appendChild(reHideButton);
    } else {
      // Fallback: add to the top-right area of the post
      const headerArea = postElement.querySelector('.update-components-actor');
      if (headerArea) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'shutup-rehide-container';
        buttonContainer.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 1000;';
        buttonContainer.appendChild(reHideButton);

        // Make sure the post header has relative positioning
        headerArea.style.position = 'relative';
        headerArea.appendChild(buttonContainer);
      }
    }
  }

  /**
   * Re-hides a revealed post
   */
  reHidePost(postId) {
    const revealedPost = this.revealedPosts.get(postId);
    if (!revealedPost) return;

    // Remove the re-hide button
    if (revealedPost.reHideButton.parentNode) {
      revealedPost.reHideButton.parentNode.removeChild(revealedPost.reHideButton);
    }

    // Hide the post again using the original hide method
    this.hidePost(
      revealedPost.originalElement,
      revealedPost.score,
      revealedPost.preview
    );

    console.log(`ShutUpLinkedIn: Re-hidden post ${postId}`);
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
   * Whitelists an author
   */
  async whitelistAuthor(authorInfo, postId) {
    if (!authorInfo || !authorInfo.name) return;

    const authorKey = this.generateAuthorKey(authorInfo);
    this.whitelist.add(authorKey);

    // Save to storage
    await this.saveWhitelist();

    // Reveal the post since author is now whitelisted
    this.revealPost(postId);

    console.log(`ShutUpLinkedIn: Whitelisted author: ${authorInfo.name}`);
  }

  /**
   * Checks if an author is whitelisted
   */
  isWhitelisted(authorInfo) {
    if (!authorInfo || !authorInfo.name) return false;
    const authorKey = this.generateAuthorKey(authorInfo);
    return this.whitelist.has(authorKey);
  }

  /**
   * Generates a unique key for an author
   */
  generateAuthorKey(authorInfo) {
    // Use name as primary identifier, fallback to image URL
    return authorInfo.name?.toLowerCase().trim() || authorInfo.image || 'unknown';
  }

  /**
   * Loads whitelist from storage
   */
  async loadWhitelist() {
    try {
      const stored = await chrome.storage.local.get(['shutup_whitelist']);
      if (stored.shutup_whitelist) {
        this.whitelist = new Set(stored.shutup_whitelist);
      }
    } catch (error) {
      console.log('ShutUpLinkedIn: Could not load whitelist');
    }
  }

  /**
   * Saves whitelist to storage
   */
  async saveWhitelist() {
    try {
      const whitelistArray = Array.from(this.whitelist);
      await chrome.storage.local.set({ shutup_whitelist: whitelistArray });
    } catch (error) {
      console.log('ShutUpLinkedIn: Could not save whitelist');
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

  /**
   * Cleans up duplicate re-hide buttons that might exist on the page
   */
  cleanupDuplicateButtons() {
    const allReHideButtons = document.querySelectorAll('.shutup-rehide-btn');
    const postIdToButtons = new Map();

    // Group buttons by post ID
    allReHideButtons.forEach(button => {
      const postId = button.dataset.postId;
      if (!postId) return;

      if (!postIdToButtons.has(postId)) {
        postIdToButtons.set(postId, []);
      }
      postIdToButtons.get(postId).push(button);
    });

    // Remove duplicate buttons, keeping only the first one for each post
    postIdToButtons.forEach((buttons, postId) => {
      if (buttons.length > 1) {
        console.log(`ShutUpLinkedIn: Found ${buttons.length} duplicate buttons for post ${postId}, cleaning up...`);

        // Remove all but the first button
        for (let i = 1; i < buttons.length; i++) {
          const button = buttons[i];
          if (button.parentNode) {
            button.parentNode.removeChild(button);
          }
        }
      }
    });

    // Also clean up orphaned containers
    const containers = document.querySelectorAll('.shutup-rehide-container');
    containers.forEach(container => {
      if (!container.querySelector('.shutup-rehide-btn')) {
        // Container is empty, remove it
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    });
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostAction;
}
