// ML Manager
// Orchestrates TensorFlow.js and Ollama classifiers with automatic fallback processing

class MLManager {
  constructor() {
    this.tfClassifier = new TfClassifier();
    this.ollamaClassifier = new OllamaClassifier();

    this.config = {
      backend: 'automatic', // 'rules', 'tensorflow', 'ollama', 'automatic'
      confidenceThreshold: 0.6,
      fallbackOrder: ['ollama', 'tensorflow', 'rules'],
      adaptiveMode: true // Automatically choose best backend
    };

    this.stats = {
      totalClassifications: 0,
      backendUsage: {
        rules: 0,
        tensorflow: 0,
        ollama: 0,
        automatic: 0
      },
      performance: {
        tensorflow: { totalTime: 0, count: 0 },
        ollama: { totalTime: 0, count: 0 }
      },
      accuracy: {
        tensorflow: { correct: 0, total: 0 },
        ollama: { correct: 0, total: 0 },
        automatic: { correct: 0, total: 0 }
      }
    };

    this.initialized = false;
    this.trainingData = null;
  }

  // Initialize all ML backends
  async init(trainingData = null) {
    try {
      console.log('MLManager: Initializing all backends...');

      // Load configuration and stats
      await this.loadConfig();
      await this.loadStats();

      this.trainingData = trainingData;

      // Initialize backends in parallel for efficiency
      const initPromises = [];

      // Always try to initialize TensorFlow.js (browser-native)
      initPromises.push(
        this.tfClassifier.init(trainingData)
          .then(success => ({ backend: 'tensorflow', success }))
          .catch(error => ({ backend: 'tensorflow', success: false, error }))
      );

      // Initialize Ollama if enabled
      if (this.isBackendEnabled('ollama')) {
        initPromises.push(
          this.ollamaClassifier.init()
            .then(success => ({ backend: 'ollama', success }))
            .catch(error => ({ backend: 'ollama', success: false, error }))
        );
      }

      const results = await Promise.all(initPromises);

      // Process initialization results
      const available = { tensorflow: false, ollama: false };

      for (const result of results) {
        available[result.backend] = result.success;
        if (result.success) {
          console.log(`MLManager: ${result.backend} initialized successfully`);
        } else {
          console.warn(`MLManager: ${result.backend} initialization failed:`, result.error?.message);
        }
      }

      this.availableBackends = available;

      // Auto-adjust backend if current choice is unavailable
      if (this.config.adaptiveMode) {
        await this.selectOptimalBackend();
      }

      this.initialized = true;
      console.log(`MLManager: Initialized with backends: ${Object.keys(available).filter(k => available[k]).join(', ')}`);

      return {
        success: true,
        availableBackends: available,
        selectedBackend: this.config.backend
      };

    } catch (error) {
      console.error('MLManager: Initialization failed', error);
      this.initialized = false;
      return { success: false, error: error.message };
    }
  }

  // Main classification method
  async classify(text, context = {}) {
    if (!this.initialized) {
      throw new Error('MLManager not initialized. Call init() first.');
    }

    const startTime = Date.now();
    this.stats.totalClassifications++;

    try {
      let result;

      switch (this.config.backend) {
        case 'tensorflow':
          result = await this.classifyWithTensorFlow(text, context);
          break;

        case 'ollama':
          result = await this.classifyWithOllama(text, context);
          break;

        case 'automatic':
          result = await this.classifyAutomatic(text, context);
          break;

        default: // 'rules' or fallback
          result = this.createFallbackResult(text);
      }

      // Add ML metadata
      result.mlBackend = this.config.backend;
      result.totalResponseTime = Date.now() - startTime;
      result.availableBackends = this.availableBackends;

      // Update stats
      this.updateStats(this.config.backend, result);

      return result;

    } catch (error) {
      console.error('MLManager: Classification failed', error);

      // Only fallback if in automatic mode
      if (this.config.backend === 'automatic') {
        const fallbackResult = await this.attemptFallback(text, context);
        fallbackResult.totalResponseTime = Date.now() - startTime;
        fallbackResult.error = error.message;
        return fallbackResult;
      } else {
        // For specific backends, throw the error without fallback
        throw error;
      }
    }
  }

  // TensorFlow.js classification
  async classifyWithTensorFlow(text, context) {
    if (!this.availableBackends.tensorflow) {
      throw new Error('TensorFlow.js backend not available');
    }

    const startTime = Date.now();
    const result = await this.tfClassifier.classify(text, context);

    this.updatePerformanceStats('tensorflow', Date.now() - startTime);
    this.stats.backendUsage.tensorflow++;

    return {
      ...result,
      reasoning: this.generateTensorFlowReasoning(result)
    };
  }

  // Ollama classification
  async classifyWithOllama(text, context) {
    if (!this.availableBackends.ollama) {
      throw new Error('Ollama backend not available');
    }

    const startTime = Date.now();
    const result = await this.ollamaClassifier.classify(text, context);

    this.updatePerformanceStats('ollama', Date.now() - startTime);
    this.stats.backendUsage.ollama++;

    return result;
  }

  // Automatic classification (tries backends in order: ollama -> tensorflow -> rules)
  async classifyAutomatic(text, context) {
    const startTime = Date.now();
    const fallbackOrder = ['ollama', 'tensorflow', 'rules'];

    // Track automatic mode usage
    this.stats.backendUsage.automatic++;

    for (const backend of fallbackOrder) {
      try {
        let result;

        switch (backend) {
          case 'ollama':
            if (this.availableBackends.ollama) {
              result = await this.classifyWithOllama(text, context);
              result.method = 'automatic_ollama';
              // Note: individual backend stats are tracked in their respective methods
              return result;
            }
            break;

          case 'tensorflow':
            if (this.availableBackends.tensorflow) {
              result = await this.classifyWithTensorFlow(text, context);
              result.method = 'automatic_tensorflow';
              // Note: individual backend stats are tracked in their respective methods
              return result;
            }
            break;

          case 'rules':
            result = this.createFallbackResult(text);
            result.method = 'automatic_rules';
            this.stats.backendUsage.rules++;
            return result;
        }
      } catch (error) {
        console.warn(`MLManager: ${backend} backend failed in automatic mode:`, error.message);
        // Continue to next backend
      }
    }

    // If all backends failed, return rules-based result as final fallback
    const fallbackResult = this.createFallbackResult(text);
    fallbackResult.method = 'automatic_fallback';
    fallbackResult.automaticResponseTime = Date.now() - startTime;
    this.stats.backendUsage.rules++;

    return fallbackResult;
  }



  // Attempt fallback when primary backend fails
  async attemptFallback(text, context) {
    for (const backend of this.config.fallbackOrder) {
      if (this.availableBackends[backend]) {
        try {
          console.log(`MLManager: Attempting fallback to ${backend}`);

          let result;
          switch (backend) {
            case 'tensorflow':
              result = await this.classifyWithTensorFlow(text, context);
              break;
            case 'ollama':
              result = await this.classifyWithOllama(text, context);
              break;
            default:
              result = this.createFallbackResult(text);
          }

          result.fallbackUsed = true;
          result.fallbackBackend = backend;

          return result;

        } catch (error) {
          console.warn(`MLManager: Fallback to ${backend} also failed:`, error.message);
          continue;
        }
      }
    }

    // All fallbacks failed - return basic rule-based result
    const fallback = this.createFallbackResult(text);
    fallback.allBackendsFailed = true;
    return fallback;
  }

  // Create basic fallback result when ML backends are unavailable
  createFallbackResult(text) {
    this.stats.backendUsage.rules++;

    return {
      confidence: 0.5,
      isBait: false,
      method: 'rules_fallback',
      reasoning: 'ML backends unavailable, using basic pattern matching',
      responseTime: 1
    };
  }

  // Auto-select optimal backend based on availability and performance
  async selectOptimalBackend() {
    const available = Object.keys(this.availableBackends).filter(k => this.availableBackends[k]);

    if (available.length === 0) {
      this.config.backend = 'rules';
      return;
    }

    // If multiple backends are available, prefer automatic mode for intelligent fallback
    if (available.length > 1) {
      this.config.backend = 'automatic';
    } else if (available.includes('ollama')) {
      this.config.backend = 'ollama';
    } else if (available.includes('tensorflow')) {
      this.config.backend = 'tensorflow';
    } else {
      this.config.backend = 'rules';
    }

    await this.saveConfig();
    console.log(`MLManager: Auto-selected ${this.config.backend} backend`);
  }

  // Generate reasoning for TensorFlow.js results
  generateTensorFlowReasoning(result) {
    if (result.confidence > 0.8) {
      return 'Neural network detected strong engagement bait patterns';
    } else if (result.confidence > 0.6) {
      return 'Neural network identified potential engagement bait characteristics';
    } else if (result.confidence < 0.3) {
      return 'Neural network found minimal bait indicators';
    } else {
      return 'Neural network classification with moderate confidence';
    }
  }

  // Provide feedback to appropriate backends
  async provideFeedback(text, actualLabel, originalResult) {
    const feedbackResults = {};

    try {
      // Route feedback to the backend(s) that made the prediction
      if (originalResult.method === 'tensorflow' || originalResult.backendResults?.tensorflow) {
        feedbackResults.tensorflow = await this.tfClassifier.provideFeedback(
          text, actualLabel, originalResult.backendResults?.tensorflow || originalResult
        );
      }

      if (originalResult.method === 'ollama' || originalResult.backendResults?.ollama) {
        // Ollama doesn't currently support feedback, but we track it
        feedbackResults.ollama = { feedbackStored: true, note: 'Feedback tracked for future training' };
      }

      // Update accuracy stats
      this.updateAccuracyStats(originalResult.method || originalResult.mlBackend, actualLabel, originalResult);

      return {
        success: true,
        feedbackResults: feedbackResults,
        accuracyUpdated: true
      };

    } catch (error) {
      console.error('MLManager: Feedback failed', error);
      return { success: false, error: error.message };
    }
  }

  // Update performance statistics
  updateStats(backend, result) {
    // Performance tracking
    if (result.responseTime) {
      const perfStats = this.stats.performance[backend];
      if (perfStats) {
        perfStats.totalTime += result.responseTime;
        perfStats.count++;
      }
    }
  }

  // Update performance stats for specific backend
  updatePerformanceStats(backend, responseTime) {
    const perfStats = this.stats.performance[backend];
    if (perfStats) {
      perfStats.totalTime += responseTime;
      perfStats.count++;
    }
  }

  // Update accuracy statistics
  updateAccuracyStats(backend, actualLabel, prediction) {
    const accStats = this.stats.accuracy[backend];
    if (!accStats) return;

    const predictedLabel = prediction.isBait ? 1 : 0;
    const isCorrect = predictedLabel === actualLabel;

    accStats.total++;
    if (isCorrect) {
      accStats.correct++;
    }
  }

  // Get comprehensive statistics
  getStats() {
    const stats = { ...this.stats };

    // Calculate derived metrics
    for (const [backend, perfStats] of Object.entries(this.stats.performance)) {
      stats.averageResponseTime = stats.averageResponseTime || {};
      stats.averageResponseTime[backend] = perfStats.count > 0 ?
        Math.round(perfStats.totalTime / perfStats.count) : 0;
    }

    for (const [backend, accStats] of Object.entries(this.stats.accuracy)) {
      stats.accuracyRates = stats.accuracyRates || {};
      stats.accuracyRates[backend] = accStats.total > 0 ?
        (accStats.correct / accStats.total) : 0;
    }

    return stats;
  }

  // Get detailed diagnostics
  async getDiagnostics() {
    const diagnostics = {
      mlManager: {
        initialized: this.initialized,
        config: this.config,
        availableBackends: this.availableBackends,
        stats: this.getStats()
      }
    };

    // Get backend-specific diagnostics
    if (this.availableBackends.tensorflow) {
      diagnostics.tensorflow = await this.tfClassifier.getDiagnostics();
    }

    if (this.availableBackends.ollama) {
      diagnostics.ollama = await this.ollamaClassifier.runDiagnostics();
    }

    return diagnostics;
  }

  // Check if backend is enabled in config
  isBackendEnabled(backend) {
    return this.config.backend === backend ||
           this.config.backend === 'automatic' ||
           this.config.fallbackOrder.includes(backend);
  }

  // Update configuration
  async updateConfig(newConfig) {
    const oldBackend = this.config.backend;
    this.config = { ...this.config, ...newConfig };

    // Reinitialize if backend changed significantly
    if (newConfig.backend && newConfig.backend !== oldBackend) {
      if (this.config.adaptiveMode) {
        await this.selectOptimalBackend();
      }
    }

    // Update backend-specific configs
    if (newConfig.ollamaConfig) {
      await this.ollamaClassifier.updateConfig(newConfig.ollamaConfig);
    }

    if (newConfig.tensorflowConfig) {
      await this.tfClassifier.updateConfig(newConfig.tensorflowConfig);
    }

    await this.saveConfig();
    return this.config;
  }

  // Test all available backends
  async testBackends() {
    const testPost = "Great insights! What do you think about this approach? Tag someone who needs to see this!";
    const results = {};

    for (const backend of ['tensorflow', 'ollama']) {
      if (this.availableBackends[backend]) {
        try {
          const startTime = Date.now();
          let result;

          if (backend === 'tensorflow') {
            result = await this.classifyWithTensorFlow(testPost, { test: true });
          } else if (backend === 'ollama') {
            result = await this.classifyWithOllama(testPost, { test: true });
          }

          results[backend] = {
            success: true,
            confidence: result.confidence,
            responseTime: Date.now() - startTime,
            reasoning: result.reasoning
          };

        } catch (error) {
          results[backend] = {
            success: false,
            error: error.message
          };
        }
      } else {
        results[backend] = {
          success: false,
          error: 'Backend not available'
        };
      }
    }

    return results;
  }

  // Save configuration
  async saveConfig() {
    try {
      await chrome.storage.local.set({ mlManagerConfig: this.config });
    } catch (error) {
      console.error('MLManager: Failed to save config', error);
    }
  }

  // Load configuration
  async loadConfig() {
    try {
      const stored = await chrome.storage.local.get(['mlManagerConfig']);
      if (stored.mlManagerConfig) {
        this.config = { ...this.config, ...stored.mlManagerConfig };
      }
    } catch (error) {
      console.warn('MLManager: Failed to load config, using defaults');
    }
  }

  // Save statistics
  async saveStats() {
    try {
      await chrome.storage.local.set({ mlManagerStats: this.stats });
    } catch (error) {
      console.error('MLManager: Failed to save stats', error);
    }
  }

  // Load statistics
  async loadStats() {
    try {
      const stored = await chrome.storage.local.get(['mlManagerStats']);
      if (stored.mlManagerStats) {
        this.stats = { ...this.stats, ...stored.mlManagerStats };
      }
    } catch (error) {
      console.warn('MLManager: Failed to load stats, using defaults');
    }
  }

  // Export all ML data
  async exportData() {
    const data = {
      mlManager: {
        config: this.config,
        stats: this.stats
      }
    };

    if (this.availableBackends.tensorflow) {
      data.tensorflow = await this.tfClassifier.exportData();
    }

    if (this.availableBackends.ollama) {
      data.ollama = await this.ollamaClassifier.exportData();
    }

    data.exportDate = new Date().toISOString();
    data.version = '1.0';

    return data;
  }

  // Reset all ML systems
  async reset() {
    // Reset individual classifiers
    if (this.availableBackends.tensorflow) {
      await this.tfClassifier.reset();
    }

    if (this.availableBackends.ollama) {
      this.ollamaClassifier.resetStats();
    }

    // Reset manager state
    this.stats = {
      totalClassifications: 0,
      backendUsage: { rules: 0, tensorflow: 0, ollama: 0, automatic: 0 },
      performance: {
        tensorflow: { totalTime: 0, count: 0 },
        ollama: { totalTime: 0, count: 0 }
      },
      accuracy: {
        tensorflow: { correct: 0, total: 0 },
        ollama: { correct: 0, total: 0 },
        automatic: { correct: 0, total: 0 }
      }
    };

    // Clear stored data
    await chrome.storage.local.remove(['mlManagerConfig', 'mlManagerStats']);

    console.log('MLManager: Reset completed');
  }

  // Cleanup resources
  dispose() {
    if (this.tfClassifier) {
      this.tfClassifier.dispose();
    }

    if (this.ollamaClassifier) {
      this.ollamaClassifier.destroy();
    }

    this.initialized = false;

    console.log('MLManager: Resources disposed');
  }
}

// Export for use in other modules
window.MLManager = MLManager;
