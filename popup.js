class PopupController {
  constructor() {
    this.settings = {
      enabled: true,
      aggressiveness: 'medium',
      showStats: true,
      hiddenCount: 0
    };

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.updateUI();
    this.bindEvents();
  }

  async loadSettings() {
    try {
      const stored = await chrome.storage.sync.get(this.settings);
      this.settings = { ...this.settings, ...stored };
    } catch (error) {
      console.log('Using default settings');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);

      // Send message to content scripts to update settings
      const tabs = await chrome.tabs.query({
        url: ["https://*.linkedin.com/*"]
      });

      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: this.settings
        }).catch(() => {
          // Tab might not have content script loaded
        });
      });

      // Show success feedback
      this.showSaveSuccess();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  updateUI() {
    // Update form elements
    document.getElementById('enabled').checked = this.settings.enabled;
    document.getElementById('aggressiveness').value = this.settings.aggressiveness;
    document.getElementById('showStats').checked = this.settings.showStats;
    document.getElementById('hiddenCount').textContent = this.settings.hiddenCount || 0;
  }

  bindEvents() {
    // Save settings button
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.collectSettings();
      this.saveSettings();
    });

    // Reset stats button
    document.getElementById('resetStats').addEventListener('click', () => {
      this.settings.hiddenCount = 0;
      document.getElementById('hiddenCount').textContent = '0';
      this.saveSettings();
    });

    // Auto-save on changes
    document.getElementById('enabled').addEventListener('change', () => {
      this.collectSettings();
      this.saveSettings();
    });

    document.getElementById('aggressiveness').addEventListener('change', () => {
      this.collectSettings();
      this.saveSettings();
    });

    document.getElementById('showStats').addEventListener('change', () => {
      this.collectSettings();
      this.saveSettings();
    });

    // Help and feedback links
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });

    document.getElementById('reportIssue').addEventListener('click', (e) => {
      e.preventDefault();
      this.openIssueReport();
    });
  }

  collectSettings() {
    this.settings.enabled = document.getElementById('enabled').checked;
    this.settings.aggressiveness = document.getElementById('aggressiveness').value;
    this.settings.showStats = document.getElementById('showStats').checked;
  }

  showSaveSuccess() {
    const saveButton = document.getElementById('saveSettings');
    const originalText = saveButton.textContent;

    saveButton.textContent = 'Saved!';
    saveButton.style.background = '#28a745';

    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.style.background = '';
    }, 1000);
  }

  showHelp() {
    const helpContent = `
ShutUpLinkedIn automatically detects and hides low-value posts using:

• Engagement bait detection ("Agree?" "Thoughts?")
• Humble bragging patterns
• Fake story indicators
• Excessive emoji/punctuation
• Generic motivational content
• Corporate buzzword spam

Aggressiveness levels:
• Low: Only obvious spam and engagement bait
• Medium: Recommended balance of filtering
• High: More aggressive filtering of low-value content

Posts are hidden with a summary - you can always click "Show anyway" to view them.
    `;

    alert(helpContent);
  }

  openIssueReport() {
    chrome.tabs.create({
      url: 'https://github.com/ismaelfi/shutuplinkedin/issues'
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
