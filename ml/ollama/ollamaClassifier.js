// Ollama Classifier
// Handles LLM-based LinkedIn bait detection using Ollama

class OllamaClassifier {
  constructor() {
    this.config = new OllamaConfig();
    this.prompts = new OllamaPrompts();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastError: null
    };

    this.initialized = false;
  }

  // Initialize the classifier
  async init() {
    try {
      await this.config.load();

      // Test connection if enabled
      if (this.config.get().enabled) {
        const connectionTest = await this.testConnection();
        if (connectionTest.success) {
          console.log('OllamaClassifier: Successfully connected to Ollama');
          this.initialized = true;
        } else {
          console.warn('OllamaClassifier: Connection failed, disabling Ollama backend');
          await this.config.update({ enabled: false });
        }
      }

      return this.initialized;
    } catch (error) {
      console.error('OllamaClassifier: Initialization failed', error);
      this.stats.lastError = error.message;
      return false;
    }
  }

  // Test connection to Ollama
  async testConnection() {
    return await this.config.testConnection();
  }

  // Main classification method
  async classify(text, context = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Check if classifier is available
      if (!this.initialized || !this.config.get().enabled) {
        throw new Error('Ollama classifier not available');
      }

      // Select optimal prompt based on content analysis
      const prompt = this.prompts.selectOptimalPrompt(text, context);

      // Make request to Ollama
      const response = await this.makeOllamaRequest(prompt);

      // Parse response
      const parsed = this.prompts.parseResponse(response);

      // Update stats
      const responseTime = Date.now() - startTime;
      this.updateStats(true, responseTime);

      return {
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        method: 'ollama',
        model: this.config.get().model,
        responseTime: responseTime,
        promptType: this.detectPromptType(prompt),
        rawResponse: parsed.rawResponse,
        parseSuccess: parsed.parseSuccess
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateStats(false, responseTime);
      this.stats.lastError = error.message;

      console.error('OllamaClassifier: Classification failed', error);

      return {
        confidence: 0.5,
        reasoning: `Classification failed: ${error.message}`,
        method: 'ollama_failed',
        error: error.message,
        responseTime: responseTime
      };
    }
  }

  // Make request to Ollama API via background script
  async makeOllamaRequest(prompt) {
    const config = this.config.get();
    const modelPreset = this.config.getCurrentModelPreset();

    try {
      // Use background script to make the request to avoid CORS issues
      const response = await chrome.runtime.sendMessage({
        type: 'OLLAMA_GENERATE',
        endpoint: config.endpoint,
        model: config.model,
        prompt: prompt,
        options: {
          ...modelPreset?.options,
          temperature: modelPreset?.options?.temperature || 0.1,
          num_predict: modelPreset?.options?.num_predict || 150
        },
        timeout: config.timeout
      });

      if (!response.success) {
        throw new Error(response.error || 'Ollama request failed');
      }

      if (!response.data || !response.data.response) {
        throw new Error('No response content from Ollama');
      }

      return response.data.response;

    } catch (error) {
      throw error;
    }
  }

  // Detect what type of prompt was used (for analytics)
  detectPromptType(prompt) {
    if (prompt.includes('motivational')) return 'motivational';
    if (prompt.includes('story')) return 'story';
    if (prompt.includes('educational')) return 'educational';
    if (prompt.includes('detailed analysis')) return 'detailed';
    if (prompt.includes('Be concise')) return 'quick';
    return 'standard';
  }

  // Update performance statistics
  updateStats(success, responseTime) {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time (rolling average)
    const totalRequests = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime = (
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests
    );
  }

  // Batch classification for multiple posts
  async classifyBatch(posts, options = {}) {
    const { maxConcurrent = 3, timeout = 30000 } = options;
    const results = [];

    // Process in batches to avoid overwhelming Ollama
    for (let i = 0; i < posts.length; i += maxConcurrent) {
      const batch = posts.slice(i, i + maxConcurrent);

      const batchPromises = batch.map(async (post, index) => {
        try {
          const result = await this.classify(post.text, post.context);
          return {
            index: i + index,
            ...result,
            originalPost: post
          };
        } catch (error) {
          return {
            index: i + index,
            error: error.message,
            originalPost: post
          };
        }
      });

      // Wait for batch completion with timeout
      try {
        const batchResults = await Promise.race([
          Promise.all(batchPromises),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Batch timeout')), timeout)
          )
        ]);

        results.push(...batchResults);
      } catch (error) {
        console.error('Batch processing failed:', error);
        // Add error results for failed batch
        batch.forEach((post, index) => {
          results.push({
            index: i + index,
            error: 'Batch processing failed',
            originalPost: post
          });
        });
      }

      // Small delay between batches to be respectful to Ollama
      if (i + maxConcurrent < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Update configuration
  async updateConfig(newConfig) {
    const oldConfig = this.config.get();
    await this.config.update(newConfig);

    // Reinitialize if critical settings changed
    if (newConfig.endpoint !== oldConfig.endpoint ||
        newConfig.model !== oldConfig.model ||
        newConfig.enabled !== oldConfig.enabled) {
      this.initialized = false;
      if (newConfig.enabled) {
        await this.init();
      }
    }

    return this.config.get();
  }

  // Get current configuration
  getConfig() {
    return this.config.getUIConfig();
  }

  // Check model availability
  async checkModelAvailability(modelName = null) {
    return await this.config.checkModelAvailability(modelName);
  }

  // Get available models from Ollama
  async getAvailableModels() {
    try {
      const connectionTest = await this.testConnection();
      if (connectionTest.success) {
        return {
          success: true,
          models: connectionTest.models,
          presets: this.config.getAllModelPresets()
        };
      } else {
        return {
          success: false,
          error: connectionTest.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Performance diagnostics
  async runDiagnostics() {
    const diagnostics = {
      config: this.config.get(),
      initialized: this.initialized,
      stats: { ...this.stats },
      timestamp: Date.now()
    };

    // Test connection
    try {
      const connectionTest = await this.testConnection();
      diagnostics.connection = connectionTest;

      if (connectionTest.success) {
        // Test classification with a simple post
        const testStart = Date.now();
        const testResult = await this.classify(
          "Great insights! What do you think about this approach?",
          { diagnosticTest: true }
        );
        diagnostics.classificationTest = {
          ...testResult,
          testDuration: Date.now() - testStart
        };
      }
    } catch (error) {
      diagnostics.connectionError = error.message;
    }

    // Model availability
    try {
      const modelCheck = await this.checkModelAvailability();
      diagnostics.modelAvailability = modelCheck;
    } catch (error) {
      diagnostics.modelError = error.message;
    }

    return diagnostics;
  }

  // Get performance statistics
  getStats() {
    const config = this.config.get();

    return {
      ...this.stats,
      initialized: this.initialized,
      enabled: config.enabled,
      model: config.model,
      endpoint: config.endpoint,
      successRate: this.stats.totalRequests > 0 ?
        (this.stats.successfulRequests / this.stats.totalRequests) : 0,
      averageResponseTimeMs: Math.round(this.stats.averageResponseTime)
    };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastError: null
    };
  }

  // Export configuration and stats for backup
  exportData() {
    return {
      config: this.config.get(),
      stats: this.getStats(),
      modelPresets: this.config.getAllModelPresets(),
      exportDate: new Date().toISOString()
    };
  }

  // Import configuration from backup
  async importData(data) {
    try {
      if (data.config) {
        await this.updateConfig(data.config);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cleanup resources
  destroy() {
    this.initialized = false;
    this.resetStats();
  }
}

// Export for use in other modules
window.OllamaClassifier = OllamaClassifier;
