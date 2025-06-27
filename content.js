// ShutUpLinkedIn - Main Content Script
// Orchestrates the bait detection and post hiding functionality

// Prevent multiple initialization
if (window.shutUpLinkedInInitialized) {
  console.log('ShutUpLinkedIn: Already initialized, skipping...');
} else {
  window.shutUpLinkedInInitialized = true;

  class ShutUpLinkedIn {
    constructor() {
      this.settings = {
        enabled: true,
        aggressiveness: 'medium',
        showStats: true,
        hiddenCount: 0
      };

      // Initialize modules
      this.baitDetector = new BaitDetector();
      this.postAction = new PostAction();

      this.init();
    }

    async init() {
      // Load settings from storage
      await this.loadSettings();

      if (!this.settings.enabled) return;

      // Start monitoring
      this.startMonitoring();

      // Add mutation observer for dynamic content
      this.observeChanges();

      // Listen for settings updates from popup
      this.listenForMessages();

      console.log('ShutUpLinkedIn: Initialized and monitoring LinkedIn feed');
    }

    async loadSettings() {
      try {
        const stored = await chrome.storage.sync.get(this.settings);
        this.settings = { ...this.settings, ...stored };
      } catch (error) {
        console.log('ShutUpLinkedIn: Using default settings');
      }
    }

    listenForMessages() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'SETTINGS_UPDATED':
            this.settings = { ...this.settings, ...message.settings };
            console.log('ShutUpLinkedIn: Settings updated', this.settings);

            // Update ML backend if changed
            if (message.settings.mlBackend) {
              this.updateMLBackend(message.settings);
            }

            // Re-evaluate visible posts if aggressiveness changed
            if (this.settings.enabled) {
              this.scanAndHidePosts();
            }
            break;

          case 'GET_DEBUG_INFO':
            sendResponse({
              stats: this.postAction.getFeedbackStats(),
              recentlyHidden: this.postAction.getRecentlyHidden(),
              settings: this.settings,
              mlStats: this.baitDetector.getStats()
            });
            break;

          case 'CHECK_ML_STATUS':
            sendResponse({
              tensorflowReady: this.baitDetector.mlClassifier?.tfModel !== null,
              ollamaReady: this.baitDetector.mlClassifier?.ollamaConfig?.enabled === true,
              backend: this.settings.mlBackend || 'rules'
            });
            break;
        }
      });
    }

    startMonitoring() {
      // Initial scan
      this.scanAndHidePosts();

      // Periodic scanning for new posts
      setInterval(() => {
        if (this.settings.enabled) {
          this.scanAndHidePosts();
        }
      }, 2000);
    }

    observeChanges() {
      const observer = new MutationObserver((mutations) => {
        if (!this.settings.enabled) return;

        let shouldScan = false;

        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if new posts were added
                if (node.querySelector && (
                  node.querySelector('[data-urn*="activity"]') ||
                  node.matches('[data-urn*="activity"]') ||
                  node.querySelector('.feed-shared-update-v2') ||
                  node.querySelector('.occludable-update')
                )) {
                  shouldScan = true;
                }
              }
            });
          }
        });

        if (shouldScan) {
          setTimeout(() => this.scanAndHidePosts(), 500);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    scanAndHidePosts() {
      // Clean up any duplicate buttons before scanning for new posts
      this.postAction.cleanupDuplicateButtons();

      // LinkedIn post selectors (may need updates as LinkedIn changes)
      const postSelectors = [
        '.feed-shared-update-v2',
        '[data-urn*="activity"]',
        '.occludable-update'
      ];

      postSelectors.forEach(selector => {
        const posts = document.querySelectorAll(selector);
        posts.forEach(post => this.analyzePost(post));
      });
    }

    // ML-specific methods
    async updateMLBackend(newSettings) {
      try {
        if (this.baitDetector.mlClassifier) {
          await this.baitDetector.mlClassifier.updateSettings({
            backend: newSettings.mlBackend,
            training_mode: newSettings.mlTrainingMode
          });

          if (newSettings.ollamaEndpoint || newSettings.ollamaModel) {
            await this.baitDetector.mlClassifier.updateOllamaConfig({
              endpoint: newSettings.ollamaEndpoint,
              model: newSettings.ollamaModel
            });
          }
        }
      } catch (error) {
        console.error('Failed to update ML backend:', error);
      }
    }

    async saveHiddenCount() {
      try {
        await chrome.storage.sync.set({
          hiddenCount: this.settings.hiddenCount
        });
      } catch (error) {
        console.error('Failed to save hidden count:', error);
      }
    }

    async analyzePost(postElement) {
      // Skip if already processed
      if (postElement.dataset.shutupProcessed === 'true') return;

      // Mark as processed
      postElement.dataset.shutupProcessed = 'true';

      // Extract author info first to check whitelist
      const authorInfo = this.postAction.extractAuthorInfo(postElement);
      if (this.postAction.isWhitelisted(authorInfo)) {
        console.log(`ShutUpLinkedIn: Skipping whitelisted author: ${authorInfo.name}`);
        return;
      }

      // Extract post text
      const textContent = this.extractPostText(postElement);
      if (!textContent) return;

      // Use ML-enhanced analysis if available
      let result;
      if (this.settings.mlBackend && this.settings.mlBackend !== 'rules') {
        try {
          result = await this.baitDetector.shouldHidePostAdvanced(
            textContent,
            postElement,
            this.settings.aggressiveness,
            authorInfo
          );
        } catch (error) {
          console.warn('ML analysis failed, falling back to rules:', error);
          result = this.baitDetector.shouldHidePost(
            textContent,
            postElement,
            this.settings.aggressiveness
          );
        }
      } else {
        // Use rule-based analysis
        result = this.baitDetector.shouldHidePost(
          textContent,
          postElement,
          this.settings.aggressiveness
        );
      }

      if (result.shouldHide) {
        // Use ML reasoning if available, otherwise fall back to basic reasons
        const reasons = result.reasoning || this.getHidingReasons(textContent);

        // Hide post using PostAction
        this.postAction.hidePost(
          postElement,
          result.score,
          textContent.substring(0, 100),
          reasons,
          result.analysis // Pass ML analysis data for detailed feedback
        );

        // Update hidden count
        this.settings.hiddenCount = (this.settings.hiddenCount || 0) + 1;
        this.saveHiddenCount();
      }
    }

    extractPostText(postElement) {
      // Try different selectors for post content
      const contentSelectors = [
        '.feed-shared-text',
        '.feed-shared-text__text-view',
        '[data-test-id="main-feed-activity-card"] .break-words',
        '.feed-shared-inline-show-more-text',
        '.feed-shared-text-view',
        '.attributed-text-segment-list__content'
      ];

      for (const selector of contentSelectors) {
        const textElement = postElement.querySelector(selector);
        if (textElement) {
          return textElement.textContent || textElement.innerText || '';
        }
      }

      // Fallback to general text extraction, but be more careful
      const text = postElement.textContent || postElement.innerText || '';

      // Filter out navigation and UI elements
      if (text.length < 10 ||
          text.includes('Like') && text.includes('Comment') && text.includes('Share')) {
        return '';
      }

      return text;
    }

    getHidingReasons(text) {
      const reasons = [];
      const textLower = text.toLowerCase();

      // Check for specific patterns and provide user-friendly reasons
      if (/agree\s*\?|thoughts\s*\?|what do you think\?/i.test(text)) {
        reasons.push('Engagement bait');
      }

      if (/blessed to announce|humbled to share|grateful to announce/i.test(text)) {
        reasons.push('Humble bragging');
      }

      if (/true story|this just happened|you won't believe/i.test(text)) {
        reasons.push('Fake story');
      }

      if (/life lesson|success secret|millionaire mindset/i.test(text)) {
        reasons.push('Generic advice');
      }

      if (/leverage|synergy|disrupt|game-?changer/i.test(text)) {
        reasons.push('Corporate buzzwords');
      }

      const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu) || []).length;
      if (emojiCount > 5) {
        reasons.push('Excessive emojis');
      }

      const hashtagCount = (text.match(/#\w+/g) || []).length;
      if (hashtagCount > 5) {
        reasons.push('Too many hashtags');
      }

      if (/[!?]{3,}/.test(text)) {
        reasons.push('Excessive punctuation');
      }

      return reasons.slice(0, 3); // Limit to 3 reasons for clean UI
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.shutUpLinkedInInstance = new ShutUpLinkedIn();
    });
  } else {
    window.shutUpLinkedInInstance = new ShutUpLinkedIn();
  }
}
