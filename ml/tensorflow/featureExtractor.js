// TensorFlow.js Feature Extractor
// Converts LinkedIn post text into numerical features for neural network processing

class FeatureExtractor {
  constructor() {
    this.vocabulary = new Map();
    this.vocabularySize = 1000; // Top 1000 most common words
    this.featureSize = 100; // Total feature vector dimensions

    this.patterns = {
      // Engagement bait patterns
      cta_words: ['comment', 'share', 'like', 'follow', 'tag', 'dm', 'message', 'yes', 'no', 'agree'],
      urgency_words: ['now', 'today', 'hurry', 'limited', 'exclusive', 'secret', 'urgent'],
      emotional_words: ['amazing', 'incredible', 'shocking', 'unbelievable', 'must', 'need'],
      question_words: ['what', 'how', 'why', 'when', 'where', 'do', 'does', 'will', 'would'],

      // Genuine content indicators
      professional_words: ['experience', 'learning', 'insights', 'analysis', 'strategy', 'industry'],
      educational_words: ['tips', 'guide', 'tutorial', 'lesson', 'knowledge', 'skills'],

      // Common LinkedIn phrases
      humble_brag: ['honored', 'blessed', 'grateful', 'privilege', 'humbled'],
      story_markers: ['yesterday', 'today', 'last week', 'happened', 'experience', 'story']
    };

    this.initialized = false;
  }

  // Initialize feature extractor with training data
  async init(trainingTexts = []) {
    try {
      // Build vocabulary from training data if provided
      if (trainingTexts.length > 0) {
        this.buildVocabulary(trainingTexts);
      } else {
        // Use default vocabulary
        this.buildDefaultVocabulary();
      }

      this.initialized = true;
      console.log(`FeatureExtractor: Initialized with vocabulary size ${this.vocabulary.size}`);
      return true;
    } catch (error) {
      console.error('FeatureExtractor: Initialization failed', error);
      return false;
    }
  }

  // Build vocabulary from training texts
  buildVocabulary(texts) {
    const wordCounts = new Map();

    // Count word frequencies
    texts.forEach(text => {
      const words = this.tokenize(text);
      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
    });

    // Select top words by frequency
    const sortedWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.vocabularySize);

    // Build vocabulary map
    this.vocabulary.clear();
    sortedWords.forEach(([word, count], index) => {
      this.vocabulary.set(word, index);
    });

    console.log(`Built vocabulary with ${this.vocabulary.size} words`);
  }

  // Build default vocabulary from pattern words
  buildDefaultVocabulary() {
    let index = 0;

    // Add pattern words first (they're most important)
    Object.values(this.patterns).forEach(words => {
      words.forEach(word => {
        if (!this.vocabulary.has(word)) {
          this.vocabulary.set(word, index++);
        }
      });
    });

    // Add common LinkedIn words
    const commonLinkedInWords = [
      'career', 'job', 'work', 'team', 'company', 'business', 'professional',
      'networking', 'opportunity', 'growth', 'success', 'leadership', 'innovation',
      'technology', 'digital', 'data', 'marketing', 'sales', 'management',
      'startup', 'entrepreneur', 'investment', 'finance', 'consulting',
      'project', 'client', 'customer', 'product', 'service', 'solution'
    ];

    commonLinkedInWords.forEach(word => {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, index++);
      }
    });

    console.log(`Built default vocabulary with ${this.vocabulary.size} words`);
  }

  // Tokenize text into words
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out very short words
  }

  // Extract features from text
  extractFeatures(text) {
    if (!this.initialized) {
      console.warn('FeatureExtractor: Not initialized, using basic features');
      return this.extractBasicFeatures(text);
    }

    const features = new Array(this.featureSize).fill(0);
    let featureIndex = 0;

    // 1. Bag of Words features (first 50 dimensions)
    const bagOfWords = this.extractBagOfWords(text);
    for (let i = 0; i < 50 && i < bagOfWords.length; i++) {
      features[featureIndex++] = bagOfWords[i];
    }
    featureIndex = 50; // Ensure we're at position 50

    // 2. Pattern-based features (next 30 dimensions)
    const patternFeatures = this.extractPatternFeatures(text);
    for (let i = 0; i < patternFeatures.length; i++) {
      features[featureIndex++] = patternFeatures[i];
    }

    // 3. Statistical features (next 15 dimensions)
    const statFeatures = this.extractStatisticalFeatures(text);
    for (let i = 0; i < statFeatures.length; i++) {
      features[featureIndex++] = statFeatures[i];
    }

    // 4. Structural features (remaining 5 dimensions)
    const structuralFeatures = this.extractStructuralFeatures(text);
    for (let i = 0; i < structuralFeatures.length; i++) {
      features[featureIndex++] = structuralFeatures[i];
    }

    return features;
  }

  // Extract bag of words features
  extractBagOfWords(text) {
    const words = this.tokenize(text);
    const features = new Array(50).fill(0);

    words.forEach(word => {
      const index = this.vocabulary.get(word);
      if (index !== undefined && index < 50) {
        features[index] = 1; // Binary presence
      }
    });

    return features;
  }

  // Extract pattern-based features
  extractPatternFeatures(text) {
    const lowerText = text.toLowerCase();
    const words = this.tokenize(text);
    const features = [];

    // CTA patterns (5 features)
    features.push(this.countPatternWords(words, this.patterns.cta_words) / words.length);
    features.push(lowerText.includes('comment yes') || lowerText.includes('comment no') ? 1 : 0);
    features.push(lowerText.includes('dm me') || lowerText.includes('message me') ? 1 : 0);
    features.push(lowerText.includes('tag a friend') || lowerText.includes('tag someone') ? 1 : 0);
    features.push((text.match(/\?/g) || []).length / Math.max(1, text.length / 100)); // Question density

    // Urgency patterns (3 features)
    features.push(this.countPatternWords(words, this.patterns.urgency_words) / words.length);
    features.push(lowerText.includes('limited time') || lowerText.includes('act now') ? 1 : 0);
    features.push(lowerText.includes('exclusive') || lowerText.includes('secret') ? 1 : 0);

    // Emotional manipulation (4 features)
    features.push(this.countPatternWords(words, this.patterns.emotional_words) / words.length);
    features.push((text.match(/!/g) || []).length / Math.max(1, text.length / 100)); // Exclamation density
    features.push(this.countCapitalizedWords(text) / words.length);
    features.push(this.countPatternWords(words, this.patterns.humble_brag) / words.length);

    // Question patterns (3 features)
    features.push(this.countPatternWords(words, this.patterns.question_words) / words.length);
    features.push(lowerText.includes('what do you think') || lowerText.includes('thoughts') ? 1 : 0);
    features.push(lowerText.includes('agree') || lowerText.includes('disagree') ? 1 : 0);

    // Professional content indicators (5 features)
    features.push(this.countPatternWords(words, this.patterns.professional_words) / words.length);
    features.push(this.countPatternWords(words, this.patterns.educational_words) / words.length);
    features.push(this.countPatternWords(words, this.patterns.story_markers) / words.length);
    features.push(this.hasHashtags(text) ? 1 : 0);
    features.push(this.hasMentions(text) ? 1 : 0);

    // Engagement manipulation (5 features)
    features.push(lowerText.includes('ps:') || lowerText.includes('p.s.') ? 1 : 0);
    features.push(lowerText.includes('bonus') || lowerText.includes('btw') ? 1 : 0);
    features.push(this.hasListStructure(text) ? 1 : 0);
    features.push(this.hasEmojis(text) ? (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length / words.length : 0);
    features.push(this.hasRepeatedChars(text) ? 1 : 0);

    return features; // Should be 30 features total
  }

  // Extract statistical features
  extractStatisticalFeatures(text) {
    const words = this.tokenize(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return [
      text.length / 1000, // Normalized text length
      words.length / 100, // Normalized word count
      sentences.length / 10, // Normalized sentence count
      words.length > 0 ? text.length / words.length : 0, // Average word length
      sentences.length > 0 ? words.length / sentences.length : 0, // Average sentence length
      this.calculateReadabilityScore(text), // Readability score (0-1)
      this.calculateRepetitionScore(words), // Word repetition score
      this.calculateCoherenceScore(text), // Text coherence score
      this.calculateProfessionalismScore(words), // Professionalism indicator
      this.calculateEngagementScore(text), // Engagement manipulation score
      this.calculateEmotionalScore(text), // Emotional language score
      this.calculateUrgencyScore(text), // Urgency indicator
      this.calculateQuestionScore(text), // Question density
      this.calculatePersonalStoryScore(text), // Personal story indicator
      this.calculateMotivationalScore(text) // Motivational content score
    ];
  }

  // Extract structural features
  extractStructuralFeatures(text) {
    return [
      this.hasNumberedList(text) ? 1 : 0,
      this.hasBulletPoints(text) ? 1 : 0,
      this.hasCallout(text) ? 1 : 0,
      this.hasPostScript(text) ? 1 : 0,
      this.hasLineBreaks(text) ? text.split('\n').length / 10 : 0
    ];
  }

  // Helper methods for pattern detection
  countPatternWords(words, patterns) {
    return words.filter(word => patterns.includes(word)).length;
  }

  countCapitalizedWords(text) {
    return (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  }

  hasHashtags(text) {
    return /#\w+/.test(text);
  }

  hasMentions(text) {
    return /@\w+/.test(text);
  }

  hasListStructure(text) {
    return /^\d+\.|^[-*•]/.test(text) || text.includes('\n-') || text.includes('\n•');
  }

  hasEmojis(text) {
    return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(text);
  }

  hasRepeatedChars(text) {
    return /(.)\1{2,}/.test(text);
  }

  hasNumberedList(text) {
    return /^\d+\./.test(text) || text.includes('\n1.') || text.includes('\n2.');
  }

  hasBulletPoints(text) {
    return /^[-*•]/.test(text) || text.includes('\n-') || text.includes('\n•');
  }

  hasCallout(text) {
    return text.includes('👇') || text.includes('⬇️') || /\bbelow\b/i.test(text);
  }

  hasPostScript(text) {
    return /\bps[:\.]?\s/i.test(text) || /\bp\.s\.?\s/i.test(text);
  }

  hasLineBreaks(text) {
    return text.includes('\n');
  }

  // Advanced scoring methods
  calculateReadabilityScore(text) {
    // Simple readability based on sentence and word length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenize(text);

    if (sentences.length === 0 || words.length === 0) return 0.5;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = text.length / words.length;

    // Normalize to 0-1 range (higher = more readable)
    const readability = Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 15) / 30 - (avgCharsPerWord - 5) / 10));
    return readability;
  }

  calculateRepetitionScore(words) {
    if (words.length === 0) return 0;

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const repeatedWords = Object.values(wordCounts).filter(count => count > 1).length;
    return repeatedWords / words.length;
  }

  calculateCoherenceScore(text) {
    // Simple coherence based on transition words and sentence flow
    const transitionWords = ['however', 'therefore', 'meanwhile', 'furthermore', 'moreover', 'additionally'];
    const words = this.tokenize(text);
    const transitionCount = this.countPatternWords(words, transitionWords);

    return Math.min(1, transitionCount / Math.max(1, words.length / 50));
  }

  calculateProfessionalismScore(words) {
    const professionalScore = this.countPatternWords(words, this.patterns.professional_words);
    const educationalScore = this.countPatternWords(words, this.patterns.educational_words);

    return Math.min(1, (professionalScore + educationalScore) / Math.max(1, words.length / 20));
  }

  calculateEngagementScore(text) {
    const lowerText = text.toLowerCase();
    let score = 0;

    // Explicit CTAs
    if (lowerText.includes('comment') || lowerText.includes('share')) score += 0.3;
    if (lowerText.includes('tag') || lowerText.includes('dm')) score += 0.3;
    if (text.includes('?')) score += 0.2;
    if (lowerText.includes('thoughts') || lowerText.includes('agree')) score += 0.2;

    return Math.min(1, score);
  }

  calculateEmotionalScore(text) {
    const words = this.tokenize(text);
    const emotionalWords = this.countPatternWords(words, this.patterns.emotional_words);
    const exclamations = (text.match(/!/g) || []).length;

    return Math.min(1, (emotionalWords + exclamations / 5) / Math.max(1, words.length / 20));
  }

  calculateUrgencyScore(text) {
    const words = this.tokenize(text);
    const urgencyWords = this.countPatternWords(words, this.patterns.urgency_words);

    return Math.min(1, urgencyWords / Math.max(1, words.length / 30));
  }

  calculateQuestionScore(text) {
    const questionCount = (text.match(/\?/g) || []).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    return sentences > 0 ? Math.min(1, questionCount / sentences) : 0;
  }

  calculatePersonalStoryScore(text) {
    const words = this.tokenize(text);
    const storyMarkers = this.countPatternWords(words, this.patterns.story_markers);
    const personalPronouns = words.filter(w => ['i', 'me', 'my', 'myself'].includes(w)).length;

    return Math.min(1, (storyMarkers + personalPronouns / 2) / Math.max(1, words.length / 25));
  }

  calculateMotivationalScore(text) {
    const motivationalWords = ['inspire', 'motivate', 'dream', 'goal', 'success', 'achieve', 'hustle'];
    const words = this.tokenize(text);
    const motivationalCount = this.countPatternWords(words, motivationalWords);

    return Math.min(1, motivationalCount / Math.max(1, words.length / 30));
  }

  // Extract basic features when not fully initialized
  extractBasicFeatures(text) {
    const features = new Array(this.featureSize).fill(0);
    const words = this.tokenize(text);

    // Basic statistical features
    features[0] = Math.min(1, text.length / 1000);
    features[1] = Math.min(1, words.length / 100);
    features[2] = this.hasEmojis(text) ? 1 : 0;
    features[3] = (text.match(/\?/g) || []).length / Math.max(1, text.length / 100);
    features[4] = (text.match(/!/g) || []).length / Math.max(1, text.length / 100);

    return features;
  }

  // Get feature vector size
  getFeatureSize() {
    return this.featureSize;
  }

  // Get vocabulary info
  getVocabularyInfo() {
    return {
      size: this.vocabulary.size,
      initialized: this.initialized,
      featureSize: this.featureSize
    };
  }

  // Export vocabulary for debugging
  exportVocabulary() {
    return Array.from(this.vocabulary.entries());
  }
}

// Export for use in other modules
window.FeatureExtractor = FeatureExtractor;
