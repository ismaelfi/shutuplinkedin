// Ollama Prompt Templates
// Specialized prompts for different types of LinkedIn content analysis

class OllamaPrompts {
  constructor() {
    this.baseInstructions = {
      linkedin_context: `You are analyzing LinkedIn posts for engagement bait patterns. LinkedIn is a professional social network where people share career updates, industry insights, and business content.`,

      engagement_bait_definition: `Engagement bait includes:
- Call-to-action prompts that manipulate engagement ("comment YES", "tag a friend", "DM me")
- Emotional manipulation tactics designed to generate reactions
- Clickbait phrases and fake urgency to drive interaction
- Generic motivational content with explicit interaction requests
- Posts designed primarily to game LinkedIn's algorithm rather than provide value
- Humble bragging disguised as inspirational content`,

      output_format: `Respond ONLY in this exact format:
CONFIDENCE: [0.0-1.0]
REASONING: [brief explanation in 1-2 sentences]`,

      examples: `Examples:
CONFIDENCE: 0.85
REASONING: Contains "comment YES" CTA and urgency language designed to manipulate engagement.

CONFIDENCE: 0.15
REASONING: Appears to be genuine professional experience sharing without manipulation tactics.`
    };
  }

  // Main engagement bait detection prompt
  createEngagementBaitPrompt(text, context = {}) {
    const authorInfo = context.author ? `Author: ${context.author}` : '';
    const mediaInfo = context.hasMedia ? 'Contains media (image/video)' : '';
    const contextStr = [authorInfo, mediaInfo].filter(Boolean).join(' | ');

    return `${this.baseInstructions.linkedin_context}

${this.baseInstructions.engagement_bait_definition}

Analyze this LinkedIn post:

POST: "${text}"
${contextStr ? `CONTEXT: ${contextStr}` : ''}

${this.baseInstructions.output_format}

${this.baseInstructions.examples}`;
  }

  // Specialized prompt for motivational content analysis
  createMotivationalContentPrompt(text, context = {}) {
    return `${this.baseInstructions.linkedin_context}

You are specifically analyzing motivational/inspirational content. Look for:
- Generic life advice with no specific value
- Requests for engagement hidden as inspiration
- Recycled motivational quotes without attribution
- "Hustle culture" content designed for virality
- Personal success stories that feel fabricated

Analyze this potentially motivational post:

POST: "${text}"

Is this genuine inspiration or engagement bait?

${this.baseInstructions.output_format}`;
  }

  // Specialized prompt for story analysis
  createStoryAnalysisPrompt(text, context = {}) {
    return `${this.baseInstructions.linkedin_context}

You are analyzing story-based posts. Look for:
- "True story happened to me" narratives that seem fabricated
- Stories with convenient lessons that feel constructed
- Overuse of dramatic elements for engagement
- Stories that end with obvious moral lessons
- Humble bragging disguised as storytelling

Analyze this story-based post:

POST: "${text}"

Does this feel like a genuine experience or a fabricated story for engagement?

${this.baseInstructions.output_format}`;
  }

  // Quick classification prompt (for faster processing)
  createQuickClassificationPrompt(text) {
    return `Analyze this LinkedIn post for engagement bait. Be concise.

POST: "${text}"

Engagement bait signs: CTA requests, manipulation tactics, fake urgency, algorithm gaming.

${this.baseInstructions.output_format}`;
  }

  // Detailed analysis prompt (for complex cases)
  createDetailedAnalysisPrompt(text, context = {}) {
    const priorAnalysis = context.priorAnalysis ?
      `Prior rule-based analysis gave score: ${context.priorAnalysis.score}/10` : '';

    return `${this.baseInstructions.linkedin_context}

${this.baseInstructions.engagement_bait_definition}

Perform a detailed analysis of this LinkedIn post:

POST: "${text}"
${priorAnalysis}

Consider:
1. Intent: Is the primary goal to provide value or gain engagement?
2. Language: Does it use manipulative or genuine communication?
3. Structure: Is it designed for maximum virality or authentic sharing?
4. Content quality: Does it offer genuine insights or generic advice?
5. Call-to-actions: Are interaction requests natural or forced?

Provide your assessment:

CONFIDENCE: [0.0-1.0]
REASONING: [detailed explanation of key factors that influenced your decision]`;
  }

  // Comparative analysis prompt (when multiple posts from same author)
  createComparativePrompt(text, context = {}) {
    const authorHistory = context.authorHistory ?
      `Author's recent post pattern: ${context.authorHistory}` : '';

    return `${this.baseInstructions.linkedin_context}

Analyze this post considering the author's posting patterns:

POST: "${text}"
${authorHistory}

Does this fit a pattern of engagement farming or genuine content creation?

${this.baseInstructions.output_format}`;
  }

  // Educational content specific prompt
  createEducationalContentPrompt(text, context = {}) {
    return `${this.baseInstructions.linkedin_context}

You are analyzing educational/professional content. Look for:
- Genuine knowledge sharing vs. generic advice
- Specific insights vs. vague platitudes
- Educational value vs. engagement manipulation
- Expert knowledge vs. recycled content

Analyze this educational post:

POST: "${text}"

Is this providing genuine professional value or using education as engagement bait?

${this.baseInstructions.output_format}`;
  }

  // Multi-language prompt generator
  createMultiLanguagePrompt(text, language, context = {}) {
    const languageInstructions = {
      'fr': 'Analyser ce post LinkedIn français pour déterminer s\'il s\'agit d\'un piège à engagement.',
      'es': 'Analiza esta publicación de LinkedIn en español para determinar si es carnada de engagement.',
      'de': 'Analysiere diesen deutschen LinkedIn-Post auf Engagement-Köder.',
      'it': 'Analizza questo post LinkedIn italiano per determinare se è engagement bait.',
      'pt': 'Analise esta postagem do LinkedIn em português para determinar se é isca de engajamento.'
    };

    const instruction = languageInstructions[language] || 'Analyze this LinkedIn post for engagement bait.';

    return `${instruction}

POST: "${text}"

${this.baseInstructions.output_format}`;
  }

  // A/B testing prompt variations
  createVariationPrompt(text, variation = 'default') {
    const variations = {
      'conservative': {
        instructions: 'Be conservative in flagging content. Only mark obvious engagement bait.',
        confidence_guidance: 'Use confidence > 0.8 only for clear manipulation.'
      },
      'aggressive': {
        instructions: 'Be more sensitive to subtle engagement bait patterns.',
        confidence_guidance: 'Flag borderline cases with confidence > 0.6.'
      },
      'balanced': {
        instructions: 'Balance between catching bait and preserving genuine content.',
        confidence_guidance: 'Use standard thresholds around 0.7 confidence.'
      }
    };

    const varConfig = variations[variation] || variations['balanced'];

    return `${this.baseInstructions.linkedin_context}

${varConfig.instructions}

${this.baseInstructions.engagement_bait_definition}

Analyze this post:

POST: "${text}"

${varConfig.confidence_guidance}

${this.baseInstructions.output_format}`;
  }

  // Context-aware prompt selection
  selectOptimalPrompt(text, context = {}) {
    const textLength = text.length;
    const hasStoryMarkers = /\b(yesterday|today|last week|true story|happened|experience)\b/i.test(text);
    const hasMotivationalWords = /\b(success|motivation|inspire|dream|goal|hustle|grind)\b/i.test(text);
    const hasEducationalMarkers = /\b(learn|tip|advice|insight|analysis|strategy)\b/i.test(text);
    const hasQuestionMarkers = /\b(thoughts|agree|disagree|what do you think)\b/i.test(text);

    // Quick classification for short posts with obvious patterns
    if (textLength < 100 && hasQuestionMarkers) {
      return this.createQuickClassificationPrompt(text);
    }

    // Story analysis for narrative posts
    if (hasStoryMarkers) {
      return this.createStoryAnalysisPrompt(text, context);
    }

    // Motivational content analysis
    if (hasMotivationalWords) {
      return this.createMotivationalContentPrompt(text, context);
    }

    // Educational content analysis
    if (hasEducationalMarkers) {
      return this.createEducationalContentPrompt(text, context);
    }

    // Detailed analysis for complex or long posts
    if (textLength > 500 || context.requiresDetailedAnalysis) {
      return this.createDetailedAnalysisPrompt(text, context);
    }

    // Default engagement bait prompt
    return this.createEngagementBaitPrompt(text, context);
  }

  // Validate and parse LLM response
  parseResponse(response) {
    try {
      // Clean up response
      const cleaned = response.trim();

      // Extract confidence
      const confidenceMatch = cleaned.match(/CONFIDENCE:\s*([\d.]+)/i);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

      // Extract reasoning
      const reasoningMatch = cleaned.match(/REASONING:\s*(.+?)(?:\n|$)/is);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided';

      // Validate confidence range
      const validConfidence = Math.max(0, Math.min(1, confidence));

      return {
        confidence: validConfidence,
        reasoning: reasoning,
        rawResponse: response,
        parseSuccess: true
      };
    } catch (error) {
      console.error('Failed to parse Ollama response:', error);
      return {
        confidence: 0.5,
        reasoning: 'Failed to parse response',
        rawResponse: response,
        parseSuccess: false,
        error: error.message
      };
    }
  }

  // Get prompt statistics for optimization
  getPromptStats() {
    return {
      availablePrompts: [
        'engagement_bait',
        'motivational_content',
        'story_analysis',
        'quick_classification',
        'detailed_analysis',
        'comparative',
        'educational_content',
        'multi_language'
      ],
      variations: ['conservative', 'aggressive', 'balanced'],
      baseInstructionsLength: JSON.stringify(this.baseInstructions).length,
      averagePromptLength: 800 // Approximate
    };
  }
}

// Export for use in other modules
window.OllamaPrompts = OllamaPrompts;
