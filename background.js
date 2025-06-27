// ShutUpLinkedIn Background Service Worker

class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Remove the tab update listener that was causing duplicate injection
    // The manifest.json content_scripts will handle injection automatically
  }

  handleInstall(details) {
    if (details.reason === 'install') {
      // Set default settings on first install
      chrome.storage.sync.set({
        enabled: true,
        aggressiveness: 'medium',
        showStats: true,
        hiddenCount: 0
      });

      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
    } else if (details.reason === 'update') {
      // Handle extension updates
      console.log('ShutUpLinkedIn updated to version', chrome.runtime.getManifest().version);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'GET_SETTINGS':
        try {
          const settings = await chrome.storage.sync.get({
            enabled: true,
            aggressiveness: 'medium',
            showStats: true,
            hiddenCount: 0
          });
          sendResponse({ success: true, settings });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'UPDATE_STATS':
        try {
          const { hiddenCount } = await chrome.storage.sync.get(['hiddenCount']);
          const newCount = (hiddenCount || 0) + (message.increment || 1);
          await chrome.storage.sync.set({ hiddenCount: newCount });
          sendResponse({ success: true, hiddenCount: newCount });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'REPORT_ISSUE':
        // Handle issue reporting
        this.handleIssueReport(message.data);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  handleIssueReport(data) {
    // In a real implementation, you might send this to your analytics service
    console.log('Issue reported:', data);
  }

  // Badge management
  async updateBadge(tabId, count) {
    try {
      await chrome.action.setBadgeText({
        tabId: tabId,
        text: count > 0 ? count.toString() : ''
      });

      await chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#0a66c2'
      });
    } catch (error) {
      // Ignore badge errors
    }
  }
}

// Initialize background service
new BackgroundService();
