class PopupController {
  constructor() {
    this.settings = {
      enabled: true,
      aggressiveness: 'medium',
      showStats: true,
      hiddenCount: 0,
      mlBackend: 'automatic',
      mlTrainingMode: false,
      ollamaEndpoint: 'http://127.0.0.1:11434',
      ollamaModel: 'llama3.2:1b'
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

    // Update ML settings
    document.getElementById('mlBackend').value = this.settings.mlBackend;
    document.getElementById('mlTrainingMode').checked = this.settings.mlTrainingMode;
    document.getElementById('ollamaEndpoint').value = this.settings.ollamaEndpoint;
    document.getElementById('ollamaModel').value = this.settings.ollamaModel;

    // Show/hide Ollama settings based on backend selection
    this.toggleOllamaSettings();

    // Update ML status
    this.updateMLStatus();
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

    // ML settings events
    document.getElementById('mlBackend').addEventListener('change', () => {
      this.collectSettings();
      this.toggleOllamaSettings();
      this.updateMLStatus();
      this.saveSettings();
    });

    document.getElementById('mlTrainingMode').addEventListener('change', () => {
      this.collectSettings();
      this.saveSettings();
    });

    document.getElementById('ollamaEndpoint').addEventListener('change', () => {
      this.collectSettings();
      this.saveSettings();
    });

    document.getElementById('ollamaModel').addEventListener('change', () => {
      this.collectSettings();
      this.saveSettings();
    });

    // Test Ollama connection
    document.getElementById('testOllama').addEventListener('click', () => {
      this.testOllamaConnection();
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
    this.settings.mlBackend = document.getElementById('mlBackend').value;
    this.settings.mlTrainingMode = document.getElementById('mlTrainingMode').checked;
    this.settings.ollamaEndpoint = document.getElementById('ollamaEndpoint').value;
    this.settings.ollamaModel = document.getElementById('ollamaModel').value;
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

  // ML-specific methods
  toggleOllamaSettings() {
    const ollamaSettings = document.getElementById('ollamaSettings');
    const backend = document.getElementById('mlBackend').value;

    if (backend === 'ollama' || backend === 'automatic') {
      ollamaSettings.style.display = 'block';
    } else {
      ollamaSettings.style.display = 'none';
    }
  }

  async updateMLStatus() {
    const statusElement = document.getElementById('mlStatus');
    const backend = document.getElementById('mlBackend').value;

    switch (backend) {
      case 'rules':
        statusElement.textContent = '✅ Rule-based detection active';
        statusElement.style.color = '#28a745';
        break;

      case 'tensorflow':
        statusElement.textContent = '🧠 Loading TensorFlow.js...';
        statusElement.style.color = '#007bff';
        this.checkTensorFlowStatus(statusElement);
        break;

      case 'ollama':
        statusElement.textContent = '🤖 Connecting to Ollama...';
        statusElement.style.color = '#6f42c1';
        this.checkOllamaStatus(statusElement);
        break;

      case 'automatic':
        statusElement.textContent = '🔄 Automatic mode - testing backends...';
        statusElement.style.color = '#fd7e14';
        this.checkAutomaticStatus(statusElement);
        break;
    }
  }

  async checkTensorFlowStatus(statusElement) {
    // Send message to content script to check TensorFlow status
    try {
      const tabs = await chrome.tabs.query({
        url: ["https://*.linkedin.com/*"],
        active: true,
        currentWindow: true
      });

      if (tabs.length > 0) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CHECK_ML_STATUS'
        });

        if (response?.tensorflowReady) {
          statusElement.textContent = '✅ TensorFlow.js ready';
          statusElement.style.color = '#28a745';
        } else {
          statusElement.textContent = '⚠️ TensorFlow.js loading...';
          statusElement.style.color = '#ffc107';
        }
      }
    } catch (error) {
      statusElement.textContent = '❌ TensorFlow.js failed';
      statusElement.style.color = '#dc3545';
    }
  }

  async checkOllamaStatus(statusElement) {
    try {
      const endpoint = document.getElementById('ollamaEndpoint').value;
      const model = document.getElementById('ollamaModel').value;

      const response = await chrome.runtime.sendMessage({
        type: 'TEST_OLLAMA_CONNECTION',
        endpoint: endpoint,
        model: model
      });

      if (response.success && response.connected) {
        const modelCount = response.modelCount || 0;
        statusElement.textContent = `✅ Ollama connected (${modelCount} models)`;
        statusElement.style.color = '#28a745';
      } else {
        throw new Error(response.error || 'Connection failed');
      }
    } catch (error) {
      statusElement.textContent = '❌ Ollama not available';
      statusElement.style.color = '#dc3545';
    }
  }

  async checkAutomaticStatus(statusElement) {
    const [tfStatus, ollamaStatus] = await Promise.all([
      this.getTensorFlowStatus(),
      this.getOllamaStatus()
    ]);

    if (ollamaStatus) {
      statusElement.textContent = '✅ Automatic mode - using Ollama';
      statusElement.style.color = '#28a745';
    } else if (tfStatus) {
      statusElement.textContent = '✅ Automatic mode - using TensorFlow.js';
      statusElement.style.color = '#28a745';
    } else {
      statusElement.textContent = '✅ Automatic mode - using rules based';
      statusElement.style.color = '#28a745';
    }
  }

  async getTensorFlowStatus() {
    try {
      const tabs = await chrome.tabs.query({
        url: ["https://*.linkedin.com/*"],
        active: true,
        currentWindow: true
      });

      if (tabs.length > 0) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CHECK_ML_STATUS'
        });
        return response?.tensorflowReady || false;
      }
    } catch {
      return false;
    }
  }

  async getOllamaStatus() {
    try {
      const endpoint = document.getElementById('ollamaEndpoint').value;
      const model = document.getElementById('ollamaModel').value;

      const response = await chrome.runtime.sendMessage({
        type: 'TEST_OLLAMA_CONNECTION',
        endpoint: endpoint,
        model: model
      });

      return response.success && response.connected;
    } catch {
      return false;
    }
  }

  async testOllamaConnection() {
    const button = document.getElementById('testOllama');
    const statusElement = document.getElementById('ollamaStatus');
    const originalText = button.textContent;

    button.textContent = '🔄 Testing...';
    button.disabled = true;

    try {
      const endpoint = document.getElementById('ollamaEndpoint').value;
      const model = document.getElementById('ollamaModel').value;

      const response = await chrome.runtime.sendMessage({
        type: 'TEST_OLLAMA_CONNECTION',
        endpoint: endpoint,
        model: model
      });

      if (response.success) {
        if (response.connected && response.modelAvailable) {
          statusElement.textContent = '✅ Connection successful! Model is ready.';
          statusElement.style.color = '#28a745';
        } else if (response.connected && !response.modelAvailable) {
          statusElement.textContent = `⚠️ ${response.message}`;
          statusElement.style.color = '#ffc107';
        } else {
          statusElement.textContent = `❌ ${response.message}`;
          statusElement.style.color = '#dc3545';
        }
      } else {
        throw new Error(response.error || 'Unknown error');
      }

    } catch (error) {
      statusElement.textContent = `❌ Test failed: ${error.message}`;
      statusElement.style.color = '#dc3545';
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
