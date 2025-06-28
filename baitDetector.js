// ShutUpLinkedIn - Bait Detection Engine
// Handles all content analysis and scoring logic

class BaitDetector {
  constructor() {
    // Initialize ML classifier if available
    this.mlClassifier = null;
    this.initializeML();

    // Initialize language support
    this.languageSupport = new LanguageSupport();

    this.engagementBaitPatterns = [
      // Direct engagement bait
      /agree\s*\?/i,
      /thoughts\s*\?/i,
      /what do you think\?/i,
      /am i (the only one|wrong|right)\?/i,
      /unpopular opinion/i,
      /hot take/i,
      /controversial/i,
      /change my mind/i,
      /fight me/i,

      // Comment/engagement manipulation
      /comment yes/i,
      /tag a friend/i,
      /dm me for/i,
      /send me a message/i,
      /like if you agree/i,
      /share if you/i,
      /repost if/i,

      // Humble bragging patterns
      /blessed to announce/i,
      /humbled to share/i,
      /grateful to announce/i,
      /excited to share/i,
      /proud to announce/i,

      // Generic motivational/life lesson spam
      /life lesson/i,
      /remember this/i,
      /never forget/i,
      /golden rule/i,
      /success secret/i,
      /millionaire mindset/i,

      // Fake story patterns
      /true story/i,
      /this just happened/i,
      /you won't believe/i,
      /plot twist/i,
      /but wait/i,

      // List/number bait
      /\d+\s*(things|ways|secrets|tips|rules)/i,
      /here are \d+/i,

      // Emotional manipulation
      /if this doesn't/i,
      /this will (change|blow)/i,
      /everyone should/i,
      /nobody talks about/i,

      // PS patterns (common in LinkedIn bait)
      /p\.s\.?\s*:/i,
      /ps\s*:/i
    ];

    this.lowValueIndicators = [
      // Excessive emoji usage (fire, popcorn, heart-fire, etc.)
      /[\u{1F525}\u{1F37F}\u{2764}\u{FE0F}\u{1F494}]{2,}/u, // 🔥🍿❤️‍🔥💔
      /[\u{1F600}-\u{1F64F}][\u{1F600}-\u{1F64F}][\u{1F600}-\u{1F64F}]/u, // 3+ face emojis

      // All caps words
      /\b[A-Z]{4,}\b/g,

      // Excessive punctuation
      /[!?]{3,}/,
      /\.{4,}/,

      // Generic corporate speak
      /leverage|synergy|disrupt|revolutionize/i,
      /game-?changer/i,
      /next level/i,
      /deep dive/i,
      /circle back/i,
      /touch base/i,
      /moving forward/i,

      // Fake urgency
      /act now/i,
      /limited time/i,
      /don't miss/i,
      /last chance/i,
      /time sensitive/i
    ];

    this.motivationalWords = [
      'success', 'journey', 'mindset', 'growth', 'hustle', 'grind',
      'passion', 'dreams', 'goals', 'inspire', 'motivation', 'believe',
      'manifest', 'abundance', 'grateful', 'blessed', 'universe'
    ];
  }

  /**
   * Main scoring function - analyzes text and returns bait score (0-10+)
   * @param {string} text - Post content to analyze
   * @param {HTMLElement} postElement - DOM element for additional context
   * @returns {number} - Bait score (higher = more likely to be bait)
   */
  scorePost(text, postElement = null) {
    if (!text || text.trim().length === 0) return 0;

    let score = 0;
    const textLower = text.toLowerCase();
    const textLength = text.length;

    // 1. Language-aware analysis
    const langAnalysis = this.languageSupport.scoreTextByLanguage(text);
    score += langAnalysis.score;

    // 2. Check engagement bait patterns (high penalty) - use original patterns as fallback
    this.engagementBaitPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        score += 3;
      }
    });

    // 3. Check low-value indicators
    this.lowValueIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 1.5;
      }
    });

    // 3. Additional heuristics

    // Very short posts with excessive punctuation
    if (textLength < 50 && /[!?]{2,}/.test(text)) {
      score += 2;
    }

    // Posts that are just quotes without attribution
    if (/^["'""].+["'""]$/.test(text.trim()) && textLength < 200) {
      score += 1.5;
    }

    // Check for fake personal stories
    if (/^(so|yesterday|today|last week).*happened/i.test(text)) {
      score += 1;
    }

    // Excessive hashtags
    const hashtagCount = (text.match(/#\w+/g) || []).length;
    if (hashtagCount > 5) {
      score += hashtagCount * 0.5;
    }

    // Very long posts that are motivational rambling
    if (textLength > 1000 && this.isMotivationalRambling(text)) {
      score += 2;
    }

    // Check for CTA patterns
    score += this.detectCTAPatterns(text);

    // Check emoji density
    score += this.calculateEmojiDensity(text);

    // Check for repetitive patterns
    score += this.detectRepetitiveContent(text);

    return Math.max(0, score);
  }

  /**
   * Detects motivational rambling content
   */
  isMotivationalRambling(text) {
    const wordCount = this.motivationalWords.filter(word =>
      text.toLowerCase().includes(word)
    ).length;

    return wordCount >= 4;
  }

  /**
   * Detects Call-to-Action patterns
   */
  detectCTAPatterns(text) {
    const ctaPatterns = [
      /follow me for/i,
      /subscribe to/i,
      /check out my/i,
      /visit my/i,
      /link in bio/i,
      /click the link/i,
      /sign up for/i,
      /register now/i
    ];

    let ctaScore = 0;
    ctaPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        ctaScore += 1.5;
      }
    });

    return ctaScore;
  }

  /**
   * Calculates emoji density score
   */
  calculateEmojiDensity(text) {
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    const textLength = text.replace(/\s/g, '').length;

    if (textLength === 0) return 0;

    const density = emojiCount / textLength;

    // High emoji density is often spam
    if (density > 0.1) return 2; // More than 10% emojis
    if (density > 0.05) return 1; // More than 5% emojis

    return 0;
  }

  /**
   * Detects repetitive content patterns
   */
  detectRepetitiveContent(text) {
    // Check for repeated words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = {};

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    let repetitiveScore = 0;
    Object.values(wordCounts).forEach(count => {
      if (count > 5) repetitiveScore += count * 0.3;
    });

    // Check for repeated phrases
    const sentences = text.split(/[.!?]+/);
    if (sentences.length > 3) {
      const duplicateSentences = sentences.filter((sentence, index) =>
        sentences.indexOf(sentence) !== index
      );
      repetitiveScore += duplicateSentences.length * 1.5;
    }

    return Math.min(repetitiveScore, 5); // Cap at 5 points
  }

  /**
   * Gets threshold based on aggressiveness setting
   */
  getThreshold(aggressiveness = 'medium') {
    switch (aggressiveness) {
      case 'low': return 4;
      case 'medium': return 2.5;
      case 'high': return 1.5;
      default: return 2.5;
    }
  }

  /**
   * Initialize ML Manager if available
   */
  async initializeML() {
    try {
      if (typeof MLManager !== 'undefined' && typeof trainingData !== 'undefined') {
        this.mlClassifier = new MLManager();
        await this.mlClassifier.init(trainingData.getPosts());
        console.log('BaitDetector: ML Manager initialized successfully');
      }
    } catch (error) {
      console.log('BaitDetector: ML initialization failed, using rule-based only', error);
    }
  }

  /**
   * Enhanced analysis using both rule-based and ML classification with language support
   */
  async analyzePostAdvanced(text, postElement = null, authorInfo = null) {
    const ruleBasedResult = this.scorePost(text, postElement);

    // Language analysis
    const langAnalysis = this.languageSupport.scoreTextByLanguage(text);

    let mlResult = null;

    // Try ML classification if available
    if (this.mlClassifier) {
      try {
        const context = {
          author: authorInfo?.name,
          hasMedia: postElement?.querySelector('img, video') ? true : false,
          postId: postElement?.dataset?.urn || Date.now().toString(),
          language: langAnalysis.language,
          priorScore: ruleBasedResult,
          aggressiveness: this.getAggressivenessFromSettings(),
          useEnhancedPrompt: true // Force enhanced prompts for better accuracy
        };

        mlResult = await this.mlClassifier.classify(text, context);
      } catch (error) {
        console.error('ML classification failed:', error);
      }
    }

    return {
      ruleBasedScore: ruleBasedResult,
      languageAnalysis: langAnalysis,
      mlResult: mlResult,
      combinedScore: this.combineScores(ruleBasedResult, mlResult, langAnalysis),
      method: mlResult ? 'hybrid' : 'rules',
      detectedLanguage: langAnalysis.language
    };
  }

  /**
   * Get aggressiveness setting from storage or default
   */
  getAggressivenessFromSettings() {
    // This would typically come from extension settings
    // For now, return medium as default
    return 'medium';
  }

  /**
   * Combine rule-based and ML scores intelligently with language awareness
   */
  combineScores(ruleScore, mlResult, langAnalysis = null) {
    let baseScore = ruleScore;

    // If we have language analysis, it's already included in ruleScore
    // But we can use it for additional insights

    if (!mlResult) {
      return baseScore;
    }

    // Convert ML confidence (0-1) to rule-based scale (0-10+)
    const mlScore = mlResult.confidence * 10;

    // Adaptive weighting based on content characteristics
    let ruleWeight = 0.4;
    let mlWeight = 0.6;

    // If language analysis indicates non-English content, trust ML more
    if (langAnalysis && langAnalysis.language !== 'en') {
      mlWeight = 0.7;
      ruleWeight = 0.3;
    }

    // If ML has high confidence, trust it more
    if (mlResult.confidence > 0.8) {
      mlWeight = 0.8;
      ruleWeight = 0.2;
    }

    // If rule-based score is very high, trust it more
    if (ruleScore > 6) {
      ruleWeight = 0.6;
      mlWeight = 0.4;
    }

    // Weighted combination
    const combined = (baseScore * ruleWeight) + (mlScore * mlWeight);

    // If either method is very confident about bait, boost the score
    if (ruleScore > 5 || mlResult.confidence > 0.8) {
      return Math.max(combined, Math.max(baseScore, mlScore) * 0.9);
    }

    // If both methods agree it's not bait, reduce the score
    if (ruleScore < 2 && mlResult.confidence < 0.3) {
      return Math.min(combined, Math.max(baseScore, mlScore) * 0.8);
    }

    return combined;
  }

  /**
   * Determines if post should be hidden based on score and settings
   */
  shouldHidePost(text, postElement = null, aggressiveness = 'medium') {
    const score = this.scorePost(text, postElement);
    const threshold = this.getThreshold(aggressiveness);

    return {
      shouldHide: score >= threshold,
      score: score,
      threshold: threshold
    };
  }

  /**
   * Enhanced shouldHidePost with ML integration
   */
  async shouldHidePostAdvanced(text, postElement = null, aggressiveness = 'medium', authorInfo = null) {
    const analysis = await this.analyzePostAdvanced(text, postElement, authorInfo);
    const threshold = this.getThreshold(aggressiveness);

    // Adjust threshold for ML-enhanced detection
    const adjustedThreshold = analysis.mlResult ? threshold * 0.8 : threshold;

    const shouldHide = analysis.combinedScore >= adjustedThreshold;

    return {
      shouldHide,
      score: analysis.combinedScore,
      threshold: adjustedThreshold,
      analysis: analysis,
      reasoning: this.generateReasoning(analysis, shouldHide)
    };
  }

  /**
   * Generate human-readable reasoning for the decision with language awareness
   */
  generateReasoning(analysis, shouldHide) {
    const reasons = [];

    // Language information
    if (analysis.languageAnalysis && analysis.languageAnalysis.language !== 'en') {
      const langName = this.languageSupport.getLanguageName(analysis.languageAnalysis.language);
      reasons.push(`${langName} content analyzed`);
    }

    // Rule-based analysis
    if (analysis.ruleBasedScore > 2) {
      const patterns = [];
      if (analysis.languageAnalysis?.score > 1) {
        patterns.push('language-specific bait patterns');
      }
      if (analysis.ruleBasedScore - (analysis.languageAnalysis?.score || 0) > 2) {
        patterns.push('universal bait patterns');
      }

      const patternText = patterns.length > 0 ? ` (${patterns.join(', ')})` : '';
      reasons.push(`Rule-based detection${patternText}: ${analysis.ruleBasedScore.toFixed(1)}/10`);
    }

    // ML analysis
    if (analysis.mlResult) {
      const confidence = (analysis.mlResult.confidence * 100).toFixed(0);

      if (analysis.mlResult.confidence > 0.7) {
        reasons.push(`High AI confidence: ${confidence}%`);
      } else if (analysis.mlResult.confidence > 0.4) {
        reasons.push(`Moderate AI confidence: ${confidence}%`);
      }

      if (analysis.mlResult.reasoning) {
        // Clean up and shorten the reasoning
        const cleanReasoning = analysis.mlResult.reasoning
          .replace(/^(Contains?|Appears?|Seems?)\s*/i, '')
          .replace(/\s*\.$/, '')
          .substring(0, 100);
        reasons.push(cleanReasoning);
      }

      if (analysis.mlResult.method) {
        reasons.push(`Method: ${analysis.mlResult.method}`);
      }
    }

    // Quality indicators
    if (shouldHide && analysis.combinedScore < 3) {
      reasons.push('borderline case - review recommended');
    }

    if (reasons.length === 0) {
      return shouldHide ? 'Low-quality indicators detected' : 'Appears to be genuine content';
    }

    return reasons.join(' • ');
  }

  /**
   * Provide feedback to ML system
   */
  async addFeedback(text, wasCorrect, originalPrediction, actualLabel = null) {
    if (this.mlClassifier) {
      try {
        await this.mlClassifier.provideFeedback(text, actualLabel || (wasCorrect ? 0 : 1), originalPrediction);
      } catch (error) {
        console.error('Failed to add ML feedback:', error);
      }
    }
  }

  /**
   * Get statistics about detection performance
   */
  getStats() {
    const stats = {
      mlEnabled: !!this.mlClassifier,
      backend: 'rules-only'
    };

    if (this.mlClassifier) {
      const mlStats = this.mlClassifier.getStats();
      return { ...stats, ...mlStats, backend: this.mlClassifier.config?.backend || 'hybrid' };
    }

    return stats;
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaitDetector;
}
