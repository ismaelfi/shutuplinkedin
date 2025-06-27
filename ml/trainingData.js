// Training Data Manager for LinkedIn Bait Detection
// Contains sample data and manages user feedback collection

class TrainingDataManager {
  constructor() {
    this.sampleData = this.generateExtendedSampleData();
    this.userLabels = new Map();
  }

  // Extended sample training data based on real LinkedIn patterns
  generateExtendedSampleData() {
    return [
      // High bait posts (label: 1)
      {
        text: "🔥 COMMENT YES if you agree! This will change everything! 🔥",
        label: 1,
        category: "cta_engagement",
        baitFeatures: ["emoji_spam", "comment_demand", "urgency"]
      },
      {
        text: "DM me for the PDF that 99% of people don't know about 📩",
        label: 1,
        category: "dm_bait",
        baitFeatures: ["dm_request", "exclusivity_claim", "percentage_hook"]
      },
      {
        text: "Tag 3 friends who need to see this 👇👇👇",
        label: 1,
        category: "viral_mechanics",
        baitFeatures: ["tag_demand", "emoji_pointing", "viral_spread"]
      },
      {
        text: "🚨 VIRAL POST ALERT 🚨 Everyone is talking about this! Share to spread awareness!",
        label: 1,
        category: "viral_claim",
        baitFeatures: ["viral_claim", "urgency_alerts", "share_demand"]
      },
      {
        text: "❤️ REPOST if this resonates with you! Let's make this go viral! ❤️",
        label: 1,
        category: "emotional_manipulation",
        baitFeatures: ["repost_demand", "emotional_hook", "viral_goal"]
      },
      {
        text: "P.S. Follow me for more content like this daily! Don't miss out! 🔔",
        label: 1,
        category: "follow_bait",
        baitFeatures: ["follow_request", "fomo", "notification_emoji"]
      },
      {
        text: "DOUBLE TAP ❤️ if you believe in yourself! Success mindset starts here! 💪",
        label: 1,
        category: "engagement_manipulation",
        baitFeatures: ["double_tap_request", "motivational_bait", "action_emoji"]
      },
      {
        text: "🔥 This post is going VIRAL! 🔥 LIKE + COMMENT + SHARE if you want to see more!",
        label: 1,
        category: "triple_engagement",
        baitFeatures: ["viral_claim", "triple_cta", "caps_spam"]
      },
      {
        text: "SWIPE to see the secret most entrepreneurs hide! 👉 Comment 'MONEY' for the full guide",
        label: 1,
        category: "swipe_secret",
        baitFeatures: ["swipe_instruction", "secret_claim", "comment_code"]
      },
      {
        text: "⚡ BREAKING: The one skill that changed my life! SAVE this post and thank me later! ⚡",
        label: 1,
        category: "breaking_save",
        baitFeatures: ["breaking_news", "life_change_claim", "save_demand"]
      },

      // Medium bait posts (label: 0.5) - borderline cases
      {
        text: "What's your biggest challenge in 2024? Share in the comments 👇",
        label: 0.5,
        category: "question_engagement",
        baitFeatures: ["question_hook", "share_request"]
      },
      {
        text: "Here are 5 lessons I learned building my startup. Which one resonates most with you?",
        label: 0.5,
        category: "educational_question",
        baitFeatures: ["lesson_list", "resonance_question"]
      },
      {
        text: "Unpopular opinion: Most productivity advice is useless. Agree or disagree? 🤔",
        label: 0.5,
        category: "unpopular_opinion",
        baitFeatures: ["unpopular_opinion", "agree_disagree"]
      },

      // Low bait / genuine posts (label: 0)
      {
        text: "I just launched my new startup and learned these valuable lessons about product-market fit.",
        label: 0,
        category: "genuine_experience",
        baitFeatures: []
      },
      {
        text: "Here's my detailed analysis of the current market trends in the SaaS industry.",
        label: 0,
        category: "industry_analysis",
        baitFeatures: []
      },
      {
        text: "Sharing my experience from 10 years in the tech industry and key insights about scaling teams.",
        label: 0,
        category: "professional_sharing",
        baitFeatures: []
      },
      {
        text: "Today I attended an excellent conference on AI ethics. Key takeaways in the thread below.",
        label: 0,
        category: "conference_sharing",
        baitFeatures: []
      },
      {
        text: "Just published a new research paper on machine learning optimization techniques. Link in bio.",
        label: 0,
        category: "research_sharing",
        baitFeatures: []
      },
      {
        text: "Excited to announce our team has reached 1M users. Here's what we learned about user retention.",
        label: 0,
        category: "milestone_sharing",
        baitFeatures: []
      },
      {
        text: "Looking for feedback on our new feature design. Would appreciate thoughts from the UX community.",
        label: 0,
        category: "feedback_request",
        baitFeatures: []
      },
      {
        text: "Reflecting on a challenging year and grateful for the lessons learned. Building resilience is key.",
        label: 0,
        category: "reflection",
        baitFeatures: []
      },
      {
        text: "Interviewing candidates this week. Reminded of the importance of cultural fit beyond technical skills.",
        label: 0,
        category: "hiring_insights",
        baitFeatures: []
      },
      {
        text: "Market update: Q4 showed interesting patterns in enterprise software adoption. Data thread below.",
        label: 0,
        category: "market_analysis",
        baitFeatures: []
      },

      // Advanced bait patterns (label: 1) - sophisticated manipulation
      {
        text: "I'm going to delete this post in 24 hours, so SAVE it now! This changed my entire perspective on success.",
        label: 1,
        category: "deletion_urgency",
        baitFeatures: ["deletion_threat", "save_urgency", "perspective_claim"]
      },
      {
        text: "Most people won't read this entire post. If you're still reading, you're in the top 1%. Comment 'FOCUSED' below.",
        label: 1,
        category: "reading_challenge",
        baitFeatures: ["reading_test", "exclusivity_claim", "comment_validation"]
      },
      {
        text: "Plot twist: The advice everyone gives about networking is completely wrong. Here's what actually works...",
        label: 1,
        category: "plot_twist",
        baitFeatures: ["plot_twist", "contrarian_hook", "secret_knowledge"]
      },
      {
        text: "I've been quiet about this for months, but I can't stay silent anymore. This industry secret needs to be exposed.",
        label: 1,
        category: "silence_breaking",
        baitFeatures: ["silence_break", "secret_exposure", "industry_revelation"]
      },
      {
        text: "STOP scrolling! This might be the most important post you read today. Your future self will thank you.",
        label: 1,
        category: "scroll_stopper",
        baitFeatures: ["scroll_stop", "importance_claim", "future_self"]
      }
    ];
  }

  // Get training data for different scenarios
  getTrainingSet(options = {}) {
    const {
      includeCategories = null,
      excludeCategories = null,
      minBaitScore = null,
      maxBaitScore = null,
      shuffle = true
    } = options;

    let data = [...this.sampleData];

    // Filter by categories
    if (includeCategories) {
      data = data.filter(item => includeCategories.includes(item.category));
    }
    if (excludeCategories) {
      data = data.filter(item => !excludeCategories.includes(item.category));
    }

    // Filter by bait score
    if (minBaitScore !== null) {
      data = data.filter(item => item.label >= minBaitScore);
    }
    if (maxBaitScore !== null) {
      data = data.filter(item => item.label <= maxBaitScore);
    }

    // Shuffle if requested
    if (shuffle) {
      data = this.shuffleArray(data);
    }

    return data;
  }

  // Get balanced dataset for training
  getBalancedTrainingSet(samplesPerClass = 10) {
    const baitPosts = this.sampleData.filter(item => item.label >= 0.7);
    const genuinePosts = this.sampleData.filter(item => item.label <= 0.3);
    const mediumPosts = this.sampleData.filter(item => item.label > 0.3 && item.label < 0.7);

    return [
      ...this.shuffleArray(baitPosts).slice(0, samplesPerClass),
      ...this.shuffleArray(genuinePosts).slice(0, samplesPerClass),
      ...this.shuffleArray(mediumPosts).slice(0, Math.floor(samplesPerClass / 2))
    ];
  }

  // Analyze bait patterns in the dataset
  analyzePatterns() {
    const patterns = {};
    const categories = {};

    this.sampleData.forEach(item => {
      // Count categories
      categories[item.category] = (categories[item.category] || 0) + 1;

      // Count bait features
      item.baitFeatures.forEach(feature => {
        patterns[feature] = (patterns[feature] || 0) + 1;
      });
    });

    return {
      totalSamples: this.sampleData.length,
      baitSamples: this.sampleData.filter(item => item.label >= 0.7).length,
      genuineSamples: this.sampleData.filter(item => item.label <= 0.3).length,
      categories,
      baitPatterns: patterns
    };
  }

  // Generate test cases for specific patterns
  generateTestCases(pattern) {
    const testCases = {
      cta_engagement: [
        "COMMENT 'YES' if you want more content like this!",
        "LIKE this post if you found it valuable!",
        "SHARE if you think your network needs to see this!"
      ],
      dm_bait: [
        "DM me the word 'SUCCESS' for the free guide",
        "Send me a message for the secret strategy",
        "Private message me for exclusive access"
      ],
      viral_mechanics: [
        "Tag someone who needs to hear this",
        "Share this with 3 people you care about",
        "REPOST to help others see this message"
      ],
      urgency: [
        "This offer expires in 24 hours!",
        "Limited time only - don't miss out!",
        "ACT NOW before it's too late!"
      ]
    };

    return testCases[pattern] || [];
  }

  // Export training data in different formats
  exportTrainingData(format = 'json') {
    const data = this.getTrainingSet();

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        const headers = 'text,label,category,baitFeatures\n';
        const rows = data.map(item =>
          `"${item.text}",${item.label},"${item.category}","${item.baitFeatures.join(';')}"`
        ).join('\n');
        return headers + rows;

      case 'tensorflow':
        return {
          texts: data.map(item => item.text),
          labels: data.map(item => item.label >= 0.5 ? 1 : 0),
          features: data.map(item => ({
            category: item.category,
            baitFeatures: item.baitFeatures
          }))
        };

      default:
        return data;
    }
  }

  // Add user feedback to improve training
  addUserFeedback(postText, predictedLabel, actualLabel, confidence = null) {
    const feedbackItem = {
      text: postText,
      predictedLabel,
      actualLabel,
      confidence,
      timestamp: Date.now(),
      isCorrect: Math.abs(predictedLabel - actualLabel) < 0.3
    };

    this.userLabels.set(postText, feedbackItem);
    return feedbackItem;
  }

  // Get user feedback statistics
  getFeedbackStats() {
    const feedback = Array.from(this.userLabels.values());
    const total = feedback.length;
    const correct = feedback.filter(item => item.isCorrect).length;

    return {
      totalFeedback: total,
      correctPredictions: correct,
      accuracy: total > 0 ? correct / total : 0,
      recentFeedback: feedback.slice(-10)
    };
  }

  // Utility functions
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate adversarial examples for testing
  generateAdversarialExamples() {
    return [
      {
        text: "Sharing insights from my recent project experience.",
        label: 0,
        note: "Simple, genuine sharing"
      },
      {
        text: "Sharing insights from my recent project experience. What's your take?",
        label: 0.3,
        note: "Added question - borderline engagement"
      },
      {
        text: "Sharing insights from my recent project experience. COMMENT your take below! 👇",
        label: 0.8,
        note: "Added CTA and emoji - now bait"
      },
      {
        text: "🔥 Sharing insights from my recent project experience. COMMENT your take below! 👇",
        label: 0.9,
        note: "Added fire emoji - maximum bait"
      }
    ];
  }
}

// Export for use in other modules
window.TrainingDataManager = TrainingDataManager;
