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

      case 'TEST_OLLAMA_CONNECTION':
        this.testOllamaConnection(message.endpoint, message.model)
          .then(result => sendResponse({ success: true, ...result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        break;

      case 'OLLAMA_GENERATE':
        this.ollamaGenerate(message.endpoint, message.model, message.prompt, message.options, message.timeout)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  handleIssueReport(data) {
    // In a real implementation, you might send this to your analytics service
    console.log('Issue reported:', data);
  }

  // Test Ollama connection from background script (has network permissions)
  async testOllamaConnection(endpoint = 'http://127.0.0.1:11434', model = 'llama3.2:1b') {
    try {
      // Normalize endpoint (remove trailing slash)
      const normalizedEndpoint = endpoint.replace(/\/$/, '');

      console.log(`Testing Ollama connection: ${normalizedEndpoint}/api/tags`);

      // Test basic connection with simpler request
      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 8000);

      const tagsResponse = await fetch(`${normalizedEndpoint}/api/tags`, {
        method: 'GET',
        signal: controller1.signal
      });

      clearTimeout(timeoutId1);

      if (!tagsResponse.ok) {
        throw new Error(`Connection failed: HTTP ${tagsResponse.status} - ${tagsResponse.statusText}`);
      }

      const data = await tagsResponse.json();
      const availableModels = data.models?.map(m => m.name) || [];

      console.log(`Ollama available models: ${availableModels.join(', ')}`);

      // Check if requested model is available
      if (!availableModels.includes(model)) {
        return {
          connected: true,
          modelAvailable: false,
          availableModels: availableModels,
          message: `Model ${model} not found. Available: ${availableModels.slice(0, 3).join(', ')}`
        };
      }

      // Skip generation test for now - just return success if model is available
      console.log(`Model ${model} is available, skipping generation test for now`);

      return {
        connected: true,
        modelAvailable: true,
        modelCount: availableModels.length,
        message: 'Connection successful! Model is available.',
        note: 'Generation test skipped - model verified as available'
      };

    } catch (error) {
      let errorMessage = error.message;

      // Provide more specific error messages
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - Ollama might be slow or unavailable';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to Ollama - make sure it\'s running on the specified endpoint';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network error - check Ollama endpoint and Chrome permissions';
      }

      console.error('Ollama connection test failed:', error);

      return {
        connected: false,
        modelAvailable: false,
        error: errorMessage,
        message: `Test failed: ${errorMessage}`
      };
    }
  }

  // Generate content using Ollama API
  async ollamaGenerate(endpoint = 'http://127.0.0.1:11434', model = 'llama3.2:1b', prompt = '', options = {}, timeout = 30000) {
    try {
      const normalizedEndpoint = endpoint.replace(/\/$/, '');

      console.log(`Ollama generate request: ${model}, prompt length: ${prompt.length}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${normalizedEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 150,
            ...options
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errorText = await response.text();
          if (errorText) errorDetails = errorText;
        } catch (e) {
          // Ignore error reading response
        }
        throw new Error(`Generation failed: HTTP ${response.status} - ${errorDetails}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('No response content from Ollama');
      }

      console.log(`Ollama generation successful: ${data.response.substring(0, 50)}...`);
      return data;

    } catch (error) {
      console.error('Ollama generation error:', error);
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('Request timeout - Ollama might be slow or busy');
      }
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
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
