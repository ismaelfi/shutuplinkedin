// TensorFlow.js Model Builder
// Creates and configures neural network architectures for bait detection

class ModelBuilder {
  constructor() {
    this.models = new Map();
    this.currentModel = null;
    this.isTraining = false;

    // Model configurations
    this.configs = {
      'simple': {
        name: 'Simple Dense Network',
        description: 'Fast 2-layer network for basic detection',
        layers: [
          { type: 'dense', units: 32, activation: 'relu' },
          { type: 'dropout', rate: 0.2 },
          { type: 'dense', units: 16, activation: 'relu' },
          { type: 'dense', units: 1, activation: 'sigmoid' }
        ],
        compile: {
          optimizer: 'adam',
          loss: 'binaryCrossentropy',
          metrics: ['accuracy']
        }
      },

      'balanced': {
        name: 'Balanced Network',
        description: 'Good balance of accuracy and speed',
        layers: [
          { type: 'dense', units: 64, activation: 'relu' },
          { type: 'dropout', rate: 0.3 },
          { type: 'dense', units: 32, activation: 'relu' },
          { type: 'dropout', rate: 0.2 },
          { type: 'dense', units: 16, activation: 'relu' },
          { type: 'dense', units: 1, activation: 'sigmoid' }
        ],
        compile: {
          optimizer: tf.train.adam(0.001),
          loss: 'binaryCrossentropy',
          metrics: ['accuracy']
        }
      },

      'complex': {
        name: 'Deep Network',
        description: 'High accuracy for complex patterns',
        layers: [
          { type: 'dense', units: 128, activation: 'relu' },
          { type: 'batchNorm' },
          { type: 'dropout', rate: 0.3 },
          { type: 'dense', units: 64, activation: 'relu' },
          { type: 'batchNorm' },
          { type: 'dropout', rate: 0.3 },
          { type: 'dense', units: 32, activation: 'relu' },
          { type: 'dropout', rate: 0.2 },
          { type: 'dense', units: 16, activation: 'relu' },
          { type: 'dense', units: 1, activation: 'sigmoid' }
        ],
        compile: {
          optimizer: tf.train.adam(0.0005),
          loss: 'binaryCrossentropy',
          metrics: ['accuracy', 'precision', 'recall']
        }
      },

      'lightweight': {
        name: 'Lightweight Network',
        description: 'Minimal resource usage for mobile/slow devices',
        layers: [
          { type: 'dense', units: 16, activation: 'relu' },
          { type: 'dropout', rate: 0.1 },
          { type: 'dense', units: 8, activation: 'relu' },
          { type: 'dense', units: 1, activation: 'sigmoid' }
        ],
        compile: {
          optimizer: 'sgd',
          loss: 'binaryCrossentropy',
          metrics: ['accuracy']
        }
      }
    };

    this.defaultConfig = 'balanced';
  }

  // Build model from configuration
  async buildModel(configName = null, inputSize = 100) {
    const config = this.configs[configName || this.defaultConfig];
    if (!config) {
      throw new Error(`Model configuration '${configName}' not found`);
    }

    try {
      // Create sequential model
      const model = tf.sequential();

      // Add input layer
      let isFirstLayer = true;

      // Build layers from configuration
      for (const layerConfig of config.layers) {
        const layer = this.createLayer(layerConfig, isFirstLayer ? inputSize : null);
        model.add(layer);
        isFirstLayer = false;
      }

      // Compile model
      model.compile(config.compile);

      // Store model
      const modelKey = configName || this.defaultConfig;
      this.models.set(modelKey, model);
      this.currentModel = model;

      console.log(`ModelBuilder: Built ${config.name} with ${model.layers.length} layers`);

      return {
        model: model,
        config: config,
        summary: this.getModelSummary(model),
        parametersCount: model.countParams()
      };

    } catch (error) {
      console.error('ModelBuilder: Failed to build model', error);
      throw error;
    }
  }

  // Create individual layer from configuration
  createLayer(layerConfig, inputShape = null) {
    const { type, ...params } = layerConfig;

    switch (type) {
      case 'dense':
        return tf.layers.dense({
          units: params.units,
          activation: params.activation,
          inputShape: inputShape ? [inputShape] : undefined,
          kernelInitializer: params.kernelInitializer || 'glorotUniform',
          biasInitializer: params.biasInitializer || 'zeros',
          kernelRegularizer: params.l2 ? tf.regularizers.l2({ l2: params.l2 }) : undefined
        });

      case 'dropout':
        return tf.layers.dropout({
          rate: params.rate || 0.2
        });

      case 'batchNorm':
        return tf.layers.batchNormalization({
          momentum: params.momentum || 0.99,
          epsilon: params.epsilon || 0.001
        });

      case 'leakyRelu':
        return tf.layers.leakyReLU({
          alpha: params.alpha || 0.01
        });

      case 'conv1d':
        return tf.layers.conv1d({
          filters: params.filters,
          kernelSize: params.kernelSize,
          activation: params.activation,
          padding: params.padding || 'valid',
          strides: params.strides || 1
        });

      case 'maxPooling1d':
        return tf.layers.maxPooling1d({
          poolSize: params.poolSize || 2,
          strides: params.strides || null,
          padding: params.padding || 'valid'
        });

      case 'flatten':
        return tf.layers.flatten();

      case 'reshape':
        return tf.layers.reshape({
          targetShape: params.targetShape
        });

      default:
        throw new Error(`Unsupported layer type: ${type}`);
    }
  }

  // Train model with data
  async trainModel(features, labels, options = {}) {
    if (!this.currentModel) {
      throw new Error('No model available for training');
    }

    this.isTraining = true;

    const defaultOptions = {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      verbose: 0,
      callbacks: []
    };

    const trainOptions = { ...defaultOptions, ...options };

    try {
      // Convert data to tensors
      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels.map(l => [l]));

      console.log(`ModelBuilder: Training with ${features.length} samples for ${trainOptions.epochs} epochs`);

      // Add custom callbacks
      const callbacks = [
        ...trainOptions.callbacks,
        {
          onEpochEnd: (epoch, logs) => {
            if (options.onProgress) {
              options.onProgress({
                epoch: epoch + 1,
                totalEpochs: trainOptions.epochs,
                ...logs
              });
            }
          }
        }
      ];

      // Train the model
      const history = await this.currentModel.fit(xs, ys, {
        ...trainOptions,
        callbacks: callbacks
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      this.isTraining = false;

      console.log('ModelBuilder: Training completed');

      return {
        history: history.history,
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalAccuracy: history.history.acc ? history.history.acc[history.history.acc.length - 1] : null,
        epochs: trainOptions.epochs
      };

    } catch (error) {
      this.isTraining = false;
      console.error('ModelBuilder: Training failed', error);
      throw error;
    }
  }

  // Evaluate model performance
  async evaluateModel(testFeatures, testLabels) {
    if (!this.currentModel) {
      throw new Error('No model available for evaluation');
    }

    try {
      const xs = tf.tensor2d(testFeatures);
      const ys = tf.tensor2d(testLabels.map(l => [l]));

      const evaluation = await this.currentModel.evaluate(xs, ys);

      // Get predictions for detailed metrics
      const predictions = await this.currentModel.predict(xs);
      const predictionData = await predictions.data();

      // Calculate additional metrics
      const metrics = this.calculateMetrics(testLabels, Array.from(predictionData));

      // Clean up tensors
      xs.dispose();
      ys.dispose();
      predictions.dispose();

      // Extract evaluation results
      const loss = Array.isArray(evaluation) ? await evaluation[0].data() : await evaluation.data();
      const accuracy = Array.isArray(evaluation) && evaluation.length > 1 ?
        await evaluation[1].data() : null;

      return {
        loss: loss[0],
        accuracy: accuracy ? accuracy[0] : null,
        ...metrics,
        sampleCount: testLabels.length
      };

    } catch (error) {
      console.error('ModelBuilder: Evaluation failed', error);
      throw error;
    }
  }

  // Calculate detailed metrics
  calculateMetrics(trueLabels, predictions, threshold = 0.5) {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < trueLabels.length; i++) {
      const actual = trueLabels[i];
      const predicted = predictions[i] >= threshold ? 1 : 0;

      if (actual === 1 && predicted === 1) tp++;
      else if (actual === 0 && predicted === 1) fp++;
      else if (actual === 0 && predicted === 0) tn++;
      else if (actual === 1 && predicted === 0) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const accuracy = (tp + tn) / trueLabels.length;

    return {
      precision: precision,
      recall: recall,
      f1Score: f1Score,
      accuracy: accuracy,
      confusionMatrix: { tp, fp, tn, fn },
      threshold: threshold
    };
  }

  // Make predictions
  async predict(features) {
    if (!this.currentModel) {
      throw new Error('No model available for prediction');
    }

    try {
      // Handle single feature vector or batch
      const isStatic = Array.isArray(features[0]);
      const inputData = isStatic ? features : [features];

      const xs = tf.tensor2d(inputData);
      const predictions = await this.currentModel.predict(xs);
      const predictionData = await predictions.data();

      // Clean up tensors
      xs.dispose();
      predictions.dispose();

      const results = Array.from(predictionData);
      return isStatic ? results : results[0];

    } catch (error) {
      console.error('ModelBuilder: Prediction failed', error);
      throw error;
    }
  }

  // Save model to browser storage
  async saveModel(name = 'linkedin-bait-model') {
    if (!this.currentModel) {
      throw new Error('No model to save');
    }

    try {
      const saveUrl = `localstorage://${name}`;
      await this.currentModel.save(saveUrl);

      // Save metadata
      const metadata = {
        name: name,
        timestamp: Date.now(),
        architecture: this.getModelSummary(this.currentModel),
        parametersCount: this.currentModel.countParams()
      };

      localStorage.setItem(`${name}-metadata`, JSON.stringify(metadata));

      console.log(`ModelBuilder: Model saved as ${name}`);
      return { success: true, name, metadata };

    } catch (error) {
      console.error('ModelBuilder: Failed to save model', error);
      throw error;
    }
  }

  // Load model from browser storage
  async loadModel(name = 'linkedin-bait-model') {
    try {
      const loadUrl = `localstorage://${name}`;
      const model = await tf.loadLayersModel(loadUrl);

      this.currentModel = model;
      this.models.set(name, model);

      // Load metadata
      const metadataJson = localStorage.getItem(`${name}-metadata`);
      const metadata = metadataJson ? JSON.parse(metadataJson) : null;

      console.log(`ModelBuilder: Model loaded from ${name}`);
      return { success: true, model, metadata };

    } catch (error) {
      console.error('ModelBuilder: Failed to load model', error);
      throw error;
    }
  }

  // List saved models
  listSavedModels() {
    const models = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('tensorflowjs_models')) {
        const modelName = key.replace('tensorflowjs_models/', '').split('/')[0];
        if (modelName) {
          const metadataKey = `${modelName}-metadata`;
          const metadataJson = localStorage.getItem(metadataKey);
          const metadata = metadataJson ? JSON.parse(metadataJson) : {};

          models.push({
            name: modelName,
            ...metadata
          });
        }
      }
    }

    return models.filter((model, index, self) =>
      index === self.findIndex(m => m.name === model.name)
    );
  }

  // Delete saved model
  async deleteModel(name) {
    try {
      // Remove from browser storage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(name) || key.startsWith(`tensorflowjs_models/${name}`))) {
          keys.push(key);
        }
      }

      keys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(`${name}-metadata`);

      // Remove from memory
      this.models.delete(name);
      if (this.currentModel && this.models.get(name) === this.currentModel) {
        this.currentModel = null;
      }

      console.log(`ModelBuilder: Model ${name} deleted`);
      return { success: true };

    } catch (error) {
      console.error('ModelBuilder: Failed to delete model', error);
      throw error;
    }
  }

  // Get model summary
  getModelSummary(model = null) {
    const targetModel = model || this.currentModel;
    if (!targetModel) {
      return null;
    }

    const layers = targetModel.layers.map(layer => ({
      name: layer.name,
      type: layer.getClassName(),
      outputShape: layer.outputShape,
      params: layer.countParams()
    }));

    return {
      totalLayers: layers.length,
      totalParams: targetModel.countParams(),
      layers: layers,
      inputShape: targetModel.inputShape,
      outputShape: targetModel.outputShape
    };
  }

  // Get available model configurations
  getAvailableConfigs() {
    return Object.keys(this.configs).map(key => ({
      key: key,
      ...this.configs[key]
    }));
  }

  // Auto-select optimal configuration based on constraints
  selectOptimalConfig(constraints = {}) {
    const {
      maxParams = Infinity,
      maxLayers = Infinity,
      prioritizeSpeed = false,
      prioritizeAccuracy = false
    } = constraints;

    let bestConfig = this.defaultConfig;
    let bestScore = 0;

    for (const [key, config] of Object.entries(this.configs)) {
      // Estimate parameters (rough calculation)
      const estimatedParams = this.estimateModelParams(config);
      const layerCount = config.layers.length;

      // Skip if exceeds constraints
      if (estimatedParams > maxParams || layerCount > maxLayers) {
        continue;
      }

      // Calculate score based on priorities
      let score = 0;

      if (prioritizeSpeed) {
        score += (1 / Math.max(1, estimatedParams / 1000)) * 0.6;
        score += (1 / Math.max(1, layerCount / 3)) * 0.4;
      } else if (prioritizeAccuracy) {
        score += (estimatedParams / 10000) * 0.6;
        score += (layerCount / 8) * 0.4;
      } else {
        // Balanced scoring
        score += (estimatedParams / 5000) * 0.3;
        score += (layerCount / 6) * 0.3;
        score += (key === 'balanced' ? 1 : 0) * 0.4; // Prefer balanced by default
      }

      if (score > bestScore) {
        bestScore = score;
        bestConfig = key;
      }
    }

    return {
      recommended: bestConfig,
      config: this.configs[bestConfig],
      reasoning: this.explainConfigChoice(bestConfig, constraints)
    };
  }

  // Estimate model parameter count
  estimateModelParams(config) {
    let params = 0;
    let lastUnits = 100; // Assume input size of 100

    for (const layer of config.layers) {
      if (layer.type === 'dense') {
        params += (lastUnits + 1) * layer.units; // weights + bias
        lastUnits = layer.units;
      }
    }

    return params;
  }

  // Explain configuration choice
  explainConfigChoice(configKey, constraints) {
    const config = this.configs[configKey];
    const reasons = [];

    if (constraints.prioritizeSpeed) {
      reasons.push('Optimized for fast inference');
    } else if (constraints.prioritizeAccuracy) {
      reasons.push('Optimized for high accuracy');
    } else {
      reasons.push('Balanced performance and speed');
    }

    reasons.push(`${config.layers.length} layers`);
    reasons.push(`~${this.estimateModelParams(config)} parameters`);

    return reasons.join(', ');
  }

  // Get current model status
  getModelStatus() {
    return {
      hasModel: !!this.currentModel,
      isTraining: this.isTraining,
      modelSummary: this.getModelSummary(),
      availableModels: Array.from(this.models.keys()),
      savedModels: this.listSavedModels()
    };
  }

  // Cleanup resources
  dispose() {
    // Dispose all models
    for (const model of this.models.values()) {
      if (model && typeof model.dispose === 'function') {
        model.dispose();
      }
    }

    this.models.clear();
    this.currentModel = null;
    this.isTraining = false;

    console.log('ModelBuilder: Resources cleaned up');
  }
}

// Export for use in other modules
window.ModelBuilder = ModelBuilder;
