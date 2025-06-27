// Ollama Configuration Management
// Handles connection settings, model configurations, and presets

class OllamaConfig {
  constructor() {
    this.defaultConfig = {
      endpoint: 'http://127.0.0.1:11434',
      timeout: 5000,
      model: 'llama3.2:1b',
      enabled: false
    };

    this.modelPresets = {
      'llama3.2:latest': {
        name: 'Llama 3.2 Latest',
        description: 'Auto-updated latest version',
        size: 'Variable',
        speed: 'fast',
        accuracy: 'excellent',
        isLatest: true,
        options: {
          temperature: 0.1,
          num_predict: 200,
          top_p: 0.9
        }
      },
      'llama3.2:1b': {
        name: 'Llama 3.2 1B',
        description: 'Fast & lightweight',
        size: '1.3GB',
        speed: 'fast',
        accuracy: 'good',
        options: {
          temperature: 0.1,
          num_predict: 150,
          top_p: 0.9
        }
      },
      'llama3.2:3b': {
        name: 'Llama 3.2 3B',
        description: 'Balanced performance',
        size: '1.7GB',
        speed: 'medium',
        accuracy: 'better',
        options: {
          temperature: 0.1,
          num_predict: 200,
          top_p: 0.9
        }
      },
      'llama3.1:8b': {
        name: 'Llama 3.1 8B',
        description: 'High accuracy',
        size: '4.7GB',
        speed: 'slower',
        accuracy: 'best',
        options: {
          temperature: 0.1,
          num_predict: 250,
          top_p: 0.85
        }
      },
      'qwen2.5:1.5b': {
        name: 'Qwen 2.5 1.5B',
        description: 'Efficient alternative',
        size: '0.9GB',
        speed: 'fast',
        accuracy: 'good',
        options: {
          temperature: 0.1,
          num_predict: 150,
          top_p: 0.9
        }
      },
      'qwen2.5:3b': {
        name: 'Qwen 2.5 3B',
        description: 'Balanced alternative',
        size: '1.9GB',
        speed: 'medium',
        accuracy: 'better',
        options: {
          temperature: 0.1,
          num_predict: 200,
          top_p: 0.9
        }
      }
    };

    this.config = { ...this.defaultConfig };
  }

  // Load configuration from storage
  async load() {
    try {
      const stored = await chrome.storage.local.get(['ollamaConfig']);
      if (stored.ollamaConfig) {
        this.config = { ...this.defaultConfig, ...stored.ollamaConfig };
      }
    } catch (error) {
      console.warn('OllamaConfig: Failed to load, using defaults');
    }
    return this.config;
  }

  // Save configuration to storage
  async save() {
    try {
      await chrome.storage.local.set({ ollamaConfig: this.config });
    } catch (error) {
      console.error('OllamaConfig: Failed to save configuration');
    }
  }

  // Update configuration
  async update(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.save();
    return this.config;
  }

  // Get current configuration
  get() {
    return { ...this.config };
  }

  // Get model preset information
  getModelPreset(modelName) {
    return this.modelPresets[modelName] || null;
  }

  // Get all available model presets
  getAllModelPresets() {
    return { ...this.modelPresets };
  }

  // Get current model preset
  getCurrentModelPreset() {
    return this.getModelPreset(this.config.model);
  }

  // Test connection to Ollama via background script
  async testConnection() {
    try {
      // Use background script to avoid CORS issues
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_OLLAMA_CONNECTION',
        endpoint: this.config.endpoint,
        model: this.config.model
      });

      if (response.success) {
        return {
          success: true,
          models: response.availableModels ? response.availableModels.map(name => ({ name })) : [],
          modelCount: response.modelCount || 0,
          endpoint: this.config.endpoint
        };
      } else {
        return {
          success: false,
          error: response.error || 'Connection failed',
          endpoint: this.config.endpoint
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        endpoint: this.config.endpoint
      };
    }
  }

  // Check if specific model is available
  async checkModelAvailability(modelName = null) {
    const model = modelName || this.config.model;

    try {
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return {
          available: false,
          error: connectionTest.error
        };
      }

      const availableModels = connectionTest.models.map(m => m.name);
      const isAvailable = availableModels.includes(model);

      return {
        available: isAvailable,
        model: model,
        availableModels: availableModels,
        suggestion: isAvailable ? null : this.suggestAlternativeModel(availableModels)
      };

    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  // Suggest alternative model if requested model is not available
  suggestAlternativeModel(availableModels) {
    const preferenceOrder = ['llama3.2:latest', 'llama3.2:1b', 'qwen2.5:1.5b', 'llama3.2:3b', 'qwen2.5:3b'];

    for (const preferred of preferenceOrder) {
      if (availableModels.includes(preferred)) {
        return {
          model: preferred,
          reason: 'Fast and lightweight alternative',
          preset: this.getModelPreset(preferred)
        };
      }
    }

    // If no preferred models, suggest the first available
    if (availableModels.length > 0) {
      return {
        model: availableModels[0],
        reason: 'First available model',
        preset: this.getModelPreset(availableModels[0])
      };
    }

    return null;
  }

  // Get configuration for UI display
  getUIConfig() {
    const modelPreset = this.getCurrentModelPreset();

    return {
      ...this.config,
      modelInfo: modelPreset,
      isConfigured: this.config.endpoint && this.config.model,
      presets: this.getAllModelPresets()
    };
  }

  // Generate installation instructions
  getInstallationInstructions() {
    const currentModel = this.config.model;
    const modelInfo = this.getModelPreset(currentModel);

    return {
      steps: [
        {
          title: 'Install Ollama',
          commands: {
            macos: 'brew install ollama',
            linux: 'curl -fsSL https://ollama.ai/install.sh | sh',
            windows: 'Download from https://ollama.ai/download'
          }
        },
        {
          title: 'Start Ollama Service',
          commands: {
            all: 'ollama serve'
          }
        },
        {
          title: `Download ${modelInfo?.name || currentModel}`,
          commands: {
            all: `ollama pull ${currentModel}`
          },
          note: `This will download ~${modelInfo?.size || 'unknown size'}`
        },
        {
          title: 'Test in Extension',
          commands: {
            all: 'Click "Test Connection" in the popup'
          }
        }
      ],
      modelInfo: modelInfo,
      estimatedDownloadTime: this.estimateDownloadTime(modelInfo?.size)
    };
  }

  // Estimate download time based on model size
  estimateDownloadTime(size) {
    if (!size) return 'Unknown';

    const sizeGB = parseFloat(size.replace('GB', ''));
    const avgSpeedMbps = 50; // Assume 50 Mbps connection

    const timeMinutes = (sizeGB * 8 * 1024) / avgSpeedMbps / 60;

    if (timeMinutes < 1) return '< 1 minute';
    if (timeMinutes < 60) return `~${Math.round(timeMinutes)} minutes`;
    return `~${Math.round(timeMinutes / 60)} hours`;
  }

  // Validate configuration
  validate() {
    const errors = [];

    if (!this.config.endpoint) {
      errors.push('Endpoint URL is required');
    } else if (!this.config.endpoint.startsWith('http')) {
      errors.push('Endpoint must be a valid HTTP URL');
    }

    if (!this.config.model) {
      errors.push('Model name is required');
    }

    if (this.config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Export for use in other modules
window.OllamaConfig = OllamaConfig;
