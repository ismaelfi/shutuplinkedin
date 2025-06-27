// TensorFlow.js Classifier
// Main orchestrator for TensorFlow.js-based LinkedIn bait detection

class TfClassifier {
  constructor() {
    this.featureExtractor = new FeatureExtractor();
    this.modelBuilder = new ModelBuilder();
    this.initialized = false;
    this.ready = false;

    this.config = {
      modelType: 'balanced',
      confidenceThreshold: 0.6,
      featureSize: 100,
      autoRetrain: true,
      retrainThreshold: 20
    };

    this.stats = {
      totalPredictions: 0,
      correctPredictions: 0,
      trainingsSessions: 0,
      lastTrainingDate: null,
      feedback: []
    };

    this.feedbackBuffer = [];
  }

  // Initialize the classifier
  async init(trainingData = null) {
    try {
      console.log('TfClassifier: Initializing...');

      // Load configuration
      await this.loadConfig();

      // Initialize feature extractor
      if (trainingData) {
        const texts = trainingData.map(item => item.text);
        await this.featureExtractor.init(texts);
      } else {
        await this.featureExtractor.init();
      }

      this.initialized = true;

      // Try to load existing model
      const loadResult = await this.loadModel();
      if (!loadResult.success) {
        // Build and train new model if none exists
        await this.buildInitialModel(trainingData);
      }

      this.ready = true;
      console.log('TfClassifier: Ready for predictions');

      return true;
    } catch (error) {
      console.error('TfClassifier: Initialization failed', error);
      this.initialized = false;
      this.ready = false;
      return false;
    }
  }

  // Build initial model with training data
  async buildInitialModel(trainingData = null) {
    if (!trainingData) {
      console.log('TfClassifier: No training data provided, creating empty model');
      // Create model without training for later use
      await this.modelBuilder.buildModel(this.config.modelType, this.config.featureSize);
      return { success: true, trained: false };
    }

    try {
      console.log(`TfClassifier: Building model with ${trainingData.length} training samples`);

      // Build model
      const buildResult = await this.modelBuilder.buildModel(
        this.config.modelType,
        this.config.featureSize
      );

      // Prepare training data
      const features = [];
      const labels = [];

      for (const item of trainingData) {
        const featureVector = this.featureExtractor.extractFeatures(item.text);
        features.push(featureVector);
        labels.push(item.label);
      }

      // Train model
      const trainResult = await this.modelBuilder.trainModel(features, labels, {
        epochs: 100,
        validationSplit: 0.2,
        onProgress: (progress) => {
          if (progress.epoch % 10 === 0) {
            console.log(`Training epoch ${progress.epoch}/${progress.totalEpochs}, loss: ${progress.loss?.toFixed(4)}`);
          }
        }
      });

      // Save model
      await this.saveModel();

      // Update stats
      this.stats.trainingsSessions++;
      this.stats.lastTrainingDate = Date.now();
      await this.saveStats();

      console.log('TfClassifier: Initial model training completed');
      return {
        success: true,
        trained: true,
        finalAccuracy: trainResult.finalAccuracy,
        finalLoss: trainResult.finalLoss
      };

    } catch (error) {
      console.error('TfClassifier: Failed to build initial model', error);
      throw error;
    }
  }

  // Main classification method
  async classify(text, context = {}) {
    if (!this.ready) {
      throw new Error('TfClassifier not ready. Call init() first.');
    }

    try {
      const startTime = Date.now();

      // Extract features
      const features = this.featureExtractor.extractFeatures(text);

      // Make prediction
      const prediction = await this.modelBuilder.predict(features);
      const confidence = Array.isArray(prediction) ? prediction[0] : prediction;

      // Update stats
      this.stats.totalPredictions++;

      const result = {
        confidence: confidence,
        isBait: confidence >= this.config.confidenceThreshold,
        method: 'tensorflow',
        modelType: this.config.modelType,
        responseTime: Date.now() - startTime,
        features: features,
        threshold: this.config.confidenceThreshold
      };

      // Store for potential retraining
      this.storePredictionForFeedback(text, result, context);

      return result;

    } catch (error) {
      console.error('TfClassifier: Classification failed', error);
      return {
        confidence: 0.5,
        isBait: false,
        method: 'tensorflow_failed',
        error: error.message,
        responseTime: 0
      };
    }
  }

  // Batch classification
  async classifyBatch(posts) {
    const results = [];

    for (const post of posts) {
      try {
        const result = await this.classify(post.text, post.context);
        results.push({
          ...result,
          originalPost: post
        });
      } catch (error) {
        results.push({
          error: error.message,
          originalPost: post
        });
      }
    }

    return results;
  }

  // Provide feedback for a prediction
  async provideFeedback(text, actualLabel, originalPrediction) {
    const feedback = {
      text: text,
      predicted: originalPrediction.confidence,
      actual: actualLabel,
      timestamp: Date.now(),
      features: originalPrediction.features
    };

    this.feedbackBuffer.push(feedback);
    this.stats.feedback.push(feedback);

    // Update accuracy stats
    const wasCorrect = (originalPrediction.isBait && actualLabel === 1) ||
                       (!originalPrediction.isBait && actualLabel === 0);

    if (wasCorrect) {
      this.stats.correctPredictions++;
    }

    console.log(`TfClassifier: Feedback received. Buffer size: ${this.feedbackBuffer.length}`);

    // Auto-retrain if enough feedback
    if (this.config.autoRetrain && this.feedbackBuffer.length >= this.config.retrainThreshold) {
      await this.retrainWithFeedback();
    }

    await this.saveStats();

    return {
      feedbackStored: true,
      bufferSize: this.feedbackBuffer.length,
      willRetrain: this.feedbackBuffer.length >= this.config.retrainThreshold
    };
  }

  // Retrain model with accumulated feedback
  async retrainWithFeedback() {
    if (this.feedbackBuffer.length === 0) {
      console.log('TfClassifier: No feedback available for retraining');
      return { success: false, reason: 'No feedback data' };
    }

    try {
      console.log(`TfClassifier: Retraining with ${this.feedbackBuffer.length} feedback samples`);

      // Prepare feedback data
      const features = this.feedbackBuffer.map(f => f.features);
      const labels = this.feedbackBuffer.map(f => f.actual);

      // Retrain model
      const trainResult = await this.modelBuilder.trainModel(features, labels, {
        epochs: Math.min(50, this.feedbackBuffer.length * 2), // Adaptive epochs
        validationSplit: 0.1,
        onProgress: (progress) => {
          if (progress.epoch % 5 === 0) {
            console.log(`Retraining epoch ${progress.epoch}, loss: ${progress.loss?.toFixed(4)}`);
          }
        }
      });

      // Save updated model
      await this.saveModel();

      // Update stats
      this.stats.trainingsSessions++;
      this.stats.lastTrainingDate = Date.now();

      // Clear feedback buffer
      this.feedbackBuffer = [];

      await this.saveStats();

      console.log('TfClassifier: Retraining completed successfully');

      return {
        success: true,
        samplesUsed: features.length,
        finalAccuracy: trainResult.finalAccuracy,
        finalLoss: trainResult.finalLoss
      };

    } catch (error) {
      console.error('TfClassifier: Retraining failed', error);
      return { success: false, error: error.message };
    }
  }

  // Update configuration
  async updateConfig(newConfig) {
    const oldModelType = this.config.modelType;
    this.config = { ...this.config, ...newConfig };

    // Rebuild model if type changed
    if (newConfig.modelType && newConfig.modelType !== oldModelType) {
      await this.modelBuilder.buildModel(this.config.modelType, this.config.featureSize);
      console.log(`TfClassifier: Switched to ${this.config.modelType} model`);
    }

    await this.saveConfig();
    return this.config;
  }

  // Save model to browser storage
  async saveModel() {
    try {
      const result = await this.modelBuilder.saveModel('tf-linkedin-bait');
      console.log('TfClassifier: Model saved successfully');
      return result;
    } catch (error) {
      console.error('TfClassifier: Failed to save model', error);
      return { success: false, error: error.message };
    }
  }

  // Load model from browser storage
  async loadModel() {
    try {
      const result = await this.modelBuilder.loadModel('tf-linkedin-bait');
      console.log('TfClassifier: Model loaded successfully');
      return result;
    } catch (error) {
      console.log('TfClassifier: No existing model found, will create new one');
      return { success: false, error: error.message };
    }
  }

  // Evaluate model performance
  async evaluate(testData) {
    if (!this.ready) {
      throw new Error('Classifier not ready');
    }

    try {
      const features = testData.map(item =>
        this.featureExtractor.extractFeatures(item.text)
      );
      const labels = testData.map(item => item.label);

      const evaluation = await this.modelBuilder.evaluateModel(features, labels);

      // Add additional analysis
      const predictions = await Promise.all(
        testData.map(item => this.classify(item.text))
      );

      const detailedAnalysis = this.analyzeResults(testData, predictions);

      return {
        ...evaluation,
        ...detailedAnalysis,
        testSamples: testData.length
      };

    } catch (error) {
      console.error('TfClassifier: Evaluation failed', error);
      throw error;
    }
  }

  // Analyze classification results in detail
  analyzeResults(testData, predictions) {
    const analysis = {
      baitDetection: { tp: 0, fp: 0, tn: 0, fn: 0 },
      confidenceDistribution: { low: 0, medium: 0, high: 0 },
      errors: []
    };

    for (let i = 0; i < testData.length; i++) {
      const actual = testData[i].label;
      const pred = predictions[i];
      const predicted = pred.isBait ? 1 : 0;

      // Confusion matrix
      if (actual === 1 && predicted === 1) analysis.baitDetection.tp++;
      else if (actual === 0 && predicted === 1) analysis.baitDetection.fp++;
      else if (actual === 0 && predicted === 0) analysis.baitDetection.tn++;
      else if (actual === 1 && predicted === 0) analysis.baitDetection.fn++;

      // Confidence distribution
      if (pred.confidence < 0.4) analysis.confidenceDistribution.low++;
      else if (pred.confidence < 0.7) analysis.confidenceDistribution.medium++;
      else analysis.confidenceDistribution.high++;

      // Track errors for analysis
      if (predicted !== actual) {
        analysis.errors.push({
          text: testData[i].text.substring(0, 100) + '...',
          actual: actual,
          predicted: predicted,
          confidence: pred.confidence
        });
      }
    }

    return analysis;
  }

  // Get model diagnostics
  async getDiagnostics() {
    const modelStatus = this.modelBuilder.getModelStatus();
    const featureInfo = this.featureExtractor.getVocabularyInfo();

    return {
      initialized: this.initialized,
      ready: this.ready,
      config: this.config,
      stats: this.getStats(),
      model: modelStatus,
      features: featureInfo,
      feedbackBufferSize: this.feedbackBuffer.length,
      memoryUsage: this.getMemoryUsage()
    };
  }

  // Store prediction for potential feedback
  storePredictionForFeedback(text, result, context) {
    // Keep only recent predictions to avoid memory issues
    const maxStorage = 100;
    if (!this.recentPredictions) {
      this.recentPredictions = [];
    }

    this.recentPredictions.push({
      text: text.substring(0, 200), // Truncate to save memory
      result: { confidence: result.confidence, isBait: result.isBait },
      context: context,
      timestamp: Date.now()
    });

    // Trim old predictions
    if (this.recentPredictions.length > maxStorage) {
      this.recentPredictions = this.recentPredictions.slice(-maxStorage);
    }
  }

  // Get performance statistics
  getStats() {
    return {
      ...this.stats,
      accuracy: this.stats.totalPredictions > 0 ?
        this.stats.correctPredictions / this.stats.totalPredictions : 0,
      feedbackCount: this.stats.feedback.length,
      feedbackBufferSize: this.feedbackBuffer.length
    };
  }

  // Get memory usage information
  getMemoryUsage() {
    const modelMemory = this.modelBuilder.currentModel ?
      this.modelBuilder.currentModel.countParams() * 4 : 0; // Rough bytes estimate

    return {
      estimatedModelSize: `${(modelMemory / 1024 / 1024).toFixed(2)} MB`,
      vocabularySize: this.featureExtractor.vocabulary.size,
      feedbackSamples: this.feedbackBuffer.length,
      recentPredictions: this.recentPredictions?.length || 0
    };
  }

  // Save configuration
  async saveConfig() {
    try {
      await chrome.storage.local.set({ tfClassifierConfig: this.config });
    } catch (error) {
      console.error('TfClassifier: Failed to save config', error);
    }
  }

  // Load configuration
  async loadConfig() {
    try {
      const stored = await chrome.storage.local.get(['tfClassifierConfig']);
      if (stored.tfClassifierConfig) {
        this.config = { ...this.config, ...stored.tfClassifierConfig };
      }
    } catch (error) {
      console.warn('TfClassifier: Failed to load config, using defaults');
    }
  }

  // Save statistics
  async saveStats() {
    try {
      await chrome.storage.local.set({ tfClassifierStats: this.stats });
    } catch (error) {
      console.error('TfClassifier: Failed to save stats', error);
    }
  }

  // Load statistics
  async loadStats() {
    try {
      const stored = await chrome.storage.local.get(['tfClassifierStats']);
      if (stored.tfClassifierStats) {
        this.stats = { ...this.stats, ...stored.tfClassifierStats };
      }
    } catch (error) {
      console.warn('TfClassifier: Failed to load stats, using defaults');
    }
  }

  // Export model and data
  async exportData() {
    const diagnostics = await this.getDiagnostics();

    return {
      config: this.config,
      stats: this.stats,
      feedbackBuffer: this.feedbackBuffer,
      modelSummary: diagnostics.model.modelSummary,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import model and data
  async importData(data) {
    try {
      if (data.config) {
        await this.updateConfig(data.config);
      }

      if (data.feedbackBuffer) {
        this.feedbackBuffer = data.feedbackBuffer;
      }

      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
        await this.saveStats();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Reset and cleanup
  async reset() {
    this.feedbackBuffer = [];
    this.stats = {
      totalPredictions: 0,
      correctPredictions: 0,
      trainingsSessions: 0,
      lastTrainingDate: null,
      feedback: []
    };

    this.modelBuilder.dispose();

    // Clear stored data
    await chrome.storage.local.remove([
      'tfClassifierConfig',
      'tfClassifierStats'
    ]);

    // Delete saved model
    await this.modelBuilder.deleteModel('tf-linkedin-bait');

    this.initialized = false;
    this.ready = false;

    console.log('TfClassifier: Reset completed');
  }

  // Cleanup resources
  dispose() {
    this.modelBuilder.dispose();
    this.feedbackBuffer = [];
    this.recentPredictions = [];
    this.initialized = false;
    this.ready = false;

    console.log('TfClassifier: Resources disposed');
  }
}

// Export for use in other modules
window.TfClassifier = TfClassifier;
