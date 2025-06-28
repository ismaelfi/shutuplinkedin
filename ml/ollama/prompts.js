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

  // Enhanced multi-language prompt generator
  createMultiLanguagePrompt(text, language, context = {}) {
    const languageInstructions = {
      'fr': {
        instruction: 'Analyser ce post LinkedIn français pour déterminer s\'il s\'agit d\'un piège à engagement.',
        definition: `Les pièges à engagement incluent:
- Demandes d'action qui manipulent l'engagement ("commentez OUI", "taguez un ami", "envoyez-moi un message")
- Tactiques de manipulation émotionnelle conçues pour générer des réactions
- Phrases d'appât et fausse urgence pour stimuler l'interaction
- Contenu motivationnel générique avec demandes d'interaction explicites
- Posts conçus principalement pour tromper l'algorithme LinkedIn plutôt que d'apporter de la valeur
- Vantardise déguisée en contenu inspirant`,
        examples: `Exemples:
CONFIDENCE: 0.85
REASONING: Contient une demande "commentez OUI" et un langage d'urgence conçu pour manipuler l'engagement.

CONFIDENCE: 0.15
REASONING: Semble être un partage d'expérience professionnelle authentique sans tactiques de manipulation.`
      },
      'es': {
        instruction: 'Analiza esta publicación de LinkedIn en español para determinar si es carnada de engagement.',
        definition: `La carnada de engagement incluye:
- Llamadas a la acción que manipulan el engagement ("comenta SÍ", "etiqueta a un amigo", "envíame un mensaje")
- Tácticas de manipulación emocional diseñadas para generar reacciones
- Frases clickbait y falsa urgencia para impulsar la interacción
- Contenido motivacional genérico con solicitudes explícitas de interacción
- Posts diseñados principalmente para engañar al algoritmo de LinkedIn en lugar de aportar valor
- Presunción disfrazada como contenido inspirador`,
        examples: `Ejemplos:
CONFIDENCE: 0.85
REASONING: Contiene demanda "comenta SÍ" y lenguaje de urgencia diseñado para manipular el engagement.

CONFIDENCE: 0.15
REASONING: Parece ser compartir experiencia profesional genuina sin tácticas de manipulación.`
      },
      'de': {
        instruction: 'Analysiere diesen deutschen LinkedIn-Post auf Engagement-Köder.',
        definition: `Engagement-Köder umfasst:
- Call-to-Action-Aufforderungen, die das Engagement manipulieren ("kommentiert JA", "markiert einen Freund", "schreibt mir")
- Emotionale Manipulationstaktiken zur Reaktionserzeugung
- Clickbait-Phrasen und falsche Dringlichkeit zur Interaktionsförderung
- Generischer motivationaler Inhalt mit expliziten Interaktionsanfragen
- Posts, die hauptsächlich darauf ausgelegt sind, LinkedIns Algorithmus zu manipulieren anstatt Wert zu bieten
- Versteckte Angeberei als inspirierender Inhalt`,
        examples: `Beispiele:
CONFIDENCE: 0.85
REASONING: Enthält "kommentiert JA" Aufforderung und Dringlichkeitssprache zur Engagement-Manipulation.

CONFIDENCE: 0.15
REASONING: Scheint authentisches Teilen beruflicher Erfahrungen ohne Manipulationstaktiken zu sein.`
      },
      'it': {
        instruction: 'Analizza questo post LinkedIn italiano per determinare se è engagement bait.',
        definition: `L'engagement bait include:
- Richieste di azione che manipolano l'engagement ("commentate SÌ", "taggate un amico", "mandatemi un messaggio")
- Tattiche di manipolazione emotiva progettate per generare reazioni
- Frasi clickbait e falsa urgenza per stimolare l'interazione
- Contenuto motivazionale generico con richieste esplicite di interazione
- Post progettati principalmente per ingannare l'algoritmo di LinkedIn piuttosto che fornire valore
- Vanteria mascherata da contenuto ispirante`,
        examples: `Esempi:
CONFIDENCE: 0.85
REASONING: Contiene richiesta "commentate SÌ" e linguaggio di urgenza progettato per manipolare l'engagement.

CONFIDENCE: 0.15
REASONING: Sembra essere condivisione autentica di esperienza professionale senza tattiche di manipolazione.`
      },
      'pt': {
        instruction: 'Analise esta postagem do LinkedIn em português para determinar se é isca de engajamento.',
        definition: `Isca de engajamento inclui:
- Chamadas para ação que manipulam o engajamento ("comentem SIM", "marquem um amigo", "mandem-me mensagem")
- Táticas de manipulação emocional projetadas para gerar reações
- Frases clickbait e falsa urgência para impulsionar a interação
- Conteúdo motivacional genérico com solicitações explícitas de interação
- Posts projetados principalmente para enganar o algoritmo do LinkedIn em vez de fornecer valor
- Ostentação disfarçada como conteúdo inspirador`,
        examples: `Exemplos:
CONFIDENCE: 0.85
REASONING: Contém solicitação "comentem SIM" e linguagem de urgência projetada para manipular o engajamento.

CONFIDENCE: 0.15
REASONING: Parece ser compartilhamento autêntico de experiência profissional sem táticas de manipulação.`
      }
    };

    const langConfig = languageInstructions[language];

    if (!langConfig) {
      // Fallback to enhanced English prompt
      return this.createEnhancedEngagementBaitPrompt(text, context);
    }

    const authorInfo = context.author ? `Autor: ${context.author}` : '';
    const mediaInfo = context.hasMedia ? 'Contém mídia (imagem/vídeo)' : '';
    const contextStr = [authorInfo, mediaInfo].filter(Boolean).join(' | ');

    return `${langConfig.instruction}

${langConfig.definition}

Analise este post do LinkedIn:

POST: "${text}"
${contextStr ? `CONTEXTO: ${contextStr}` : ''}

${this.baseInstructions.output_format}

${langConfig.examples}`;
  }

  // Enhanced engagement bait prompt with better accuracy
  createEnhancedEngagementBaitPrompt(text, context = {}) {
    const authorInfo = context.author ? `Author: ${context.author}` : '';
    const mediaInfo = context.hasMedia ? 'Contains media (image/video)' : '';
    const priorScore = context.priorScore ? `Rule-based score: ${context.priorScore}/10` : '';
    const contextStr = [authorInfo, mediaInfo, priorScore].filter(Boolean).join(' | ');

    return `${this.baseInstructions.linkedin_context}

CRITICAL: Be very careful to distinguish between:
1. GENUINE professional content (experiences, insights, industry analysis, authentic stories)
2. OBVIOUS engagement bait (explicit CTAs, manipulation tactics, fake urgency)
3. BORDERLINE cases (motivational content, personal reflections with mild engagement)

${this.baseInstructions.engagement_bait_definition}

ACCURACY GUIDELINES:
- CONFIDENCE 0.8+: Only for clear, obvious engagement manipulation with explicit CTAs
- CONFIDENCE 0.6-0.8: For posts with multiple bait indicators but some genuine value
- CONFIDENCE 0.4-0.6: For borderline motivational content or mild engagement tactics
- CONFIDENCE 0.0-0.4: For genuine professional content, even if engaging

RED FLAGS (High confidence bait):
- Explicit CTAs: "comment YES", "tag a friend", "DM me for PDF"
- Manipulation: "most people won't read this", "delete this post in 24h"
- Algorithm gaming: "going viral", "SAVE this post", triple engagement requests
- Fake exclusivity: "top 1%", "secret most don't know"

YELLOW FLAGS (Medium confidence):
- Generic motivation without specific insights
- Humble bragging with engagement hooks
- Lists/numbers designed for shares
- Emotional manipulation for reactions

GREEN FLAGS (Low confidence/genuine):
- Specific professional experiences and lessons learned
- Industry analysis with data/insights
- Authentic personal stories without manipulation
- Educational content with real value
- Thoughtful reflections on professional topics

Analyze this LinkedIn post:

POST: "${text}"
${contextStr ? `CONTEXT: ${contextStr}` : ''}

Consider the author's intent, content value, and manipulation tactics before deciding.

${this.baseInstructions.output_format}

EXAMPLES:
CONFIDENCE: 0.85
REASONING: Contains explicit "comment YES" CTA and uses urgent language purely for engagement manipulation.

CONFIDENCE: 0.35
REASONING: Shares genuine professional experience with useful insights, despite being somewhat engaging in style.

CONFIDENCE: 0.65
REASONING: Generic motivational content with mild engagement hooks but lacks specific professional value.`;
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

  // Enhanced context-aware prompt selection with language detection
  selectOptimalPrompt(text, context = {}) {
    const textLength = text.length;

    // Detect language first
    const detectedLanguage = this.detectLanguage(text);
    const isNonEnglish = detectedLanguage !== 'en';

    // If non-English and we have specific language support, use multi-language prompt
    if (isNonEnglish && ['fr', 'es', 'de', 'it', 'pt'].includes(detectedLanguage)) {
      return this.createMultiLanguagePrompt(text, detectedLanguage, context);
    }

    // Analyze content patterns (with language-aware markers)
    const patterns = this.analyzeContentPatterns(text, detectedLanguage);

    // Force enhanced prompt for better accuracy
    const useEnhancedPrompt = context.useEnhancedPrompt !== false;

    // Aggressiveness-based prompt selection
    const aggressiveness = context.aggressiveness || 'medium';
    if (aggressiveness !== 'medium') {
      return this.createVariationPrompt(text, aggressiveness === 'high' ? 'aggressive' : 'conservative');
    }

    // Quick classification for short posts with obvious bait patterns
    if (textLength < 100 && patterns.hasObviousBait) {
      return this.createQuickClassificationPrompt(text);
    }

    // Story analysis for narrative posts
    if (patterns.hasStoryMarkers && textLength > 150) {
      return this.createStoryAnalysisPrompt(text, context);
    }

    // Motivational content analysis
    if (patterns.hasMotivationalContent && patterns.motivationalWordCount >= 3) {
      return this.createMotivationalContentPrompt(text, context);
    }

    // Educational content analysis
    if (patterns.hasEducationalMarkers && !patterns.hasManipulationTactics) {
      return this.createEducationalContentPrompt(text, context);
    }

    // Detailed analysis for complex posts or when accuracy is critical
    if (textLength > 500 || context.requiresDetailedAnalysis || patterns.hasMixedSignals) {
      return this.createDetailedAnalysisPrompt(text, context);
    }

    // Use enhanced prompt by default for better accuracy
    if (useEnhancedPrompt) {
      return this.createEnhancedEngagementBaitPrompt(text, context);
    }

    // Fallback to standard engagement bait prompt
    return this.createEngagementBaitPrompt(text, context);
  }

  // Analyze content patterns to determine optimal prompt type
  analyzeContentPatterns(text, language = 'en') {
    const textLower = text.toLowerCase();

    // Language-specific pattern matching
    const patterns = {
      en: {
        storyMarkers: /\b(yesterday|today|last week|true story|happened|experience|plot twist)\b/i,
        motivationalWords: /\b(success|motivation|inspire|dream|goal|hustle|grind|journey|mindset|grateful|blessed)\b/gi,
        educationalMarkers: /\b(learn|tip|advice|insight|analysis|strategy|research|study|data)\b/i,
        questionMarkers: /\b(thoughts|agree|disagree|what do you think|am i wrong|unpopular opinion)\b/i,
        obviousBait: /\b(comment yes|tag a friend|dm me|going viral|save this post|double tap)\b/i,
        manipulationTactics: /\b(most people won't|delete this post|top 1%|secret|you won't believe)\b/i
      },
      fr: {
        storyMarkers: /\b(hier|aujourd'hui|la semaine dernière|histoire vraie|est arrivé|expérience)\b/i,
        motivationalWords: /\b(succès|motivation|inspirer|rêve|objectif|voyage|mentalité|reconnaissant|béni)\b/gi,
        educationalMarkers: /\b(apprendre|conseil|aperçu|analyse|stratégie|recherche|étude|données)\b/i,
        questionMarkers: /\b(avis|d'accord|pas d'accord|qu'en pensez-vous|ai-je tort|opinion impopulaire)\b/i,
        obviousBait: /\b(commentez oui|taguez un ami|envoyez-moi|devient viral|sauvegardez|double clic)\b/i,
        manipulationTactics: /\b(la plupart ne|supprimer ce post|top 1%|secret|vous ne croirez pas)\b/i
      },
      es: {
        storyMarkers: /\b(ayer|hoy|la semana pasada|historia real|pasó|experiencia)\b/i,
        motivationalWords: /\b(éxito|motivación|inspirar|sueño|objetivo|viaje|mentalidad|agradecido|bendecido)\b/gi,
        educationalMarkers: /\b(aprender|consejo|perspectiva|análisis|estrategia|investigación|estudio|datos)\b/i,
        questionMarkers: /\b(opinión|de acuerdo|en desacuerdo|qué piensas|estoy equivocado|opinión impopular)\b/i,
        obviousBait: /\b(comenta sí|etiqueta a un amigo|envíame|se vuelve viral|guarda|doble toque)\b/i,
        manipulationTactics: /\b(la mayoría no|eliminar este post|top 1%|secreto|no creerás)\b/i
      }
    };

    const langPatterns = patterns[language] || patterns.en;

    const hasStoryMarkers = langPatterns.storyMarkers.test(text);
    const motivationalMatches = text.match(langPatterns.motivationalWords) || [];
    const hasEducationalMarkers = langPatterns.educationalMarkers.test(text);
    const hasQuestionMarkers = langPatterns.questionMarkers.test(text);
    const hasObviousBait = langPatterns.obviousBait.test(text);
    const hasManipulationTactics = langPatterns.manipulationTactics.test(text);

    // Check for mixed signals (genuine content with bait elements)
    const hasMixedSignals = (hasEducationalMarkers || hasStoryMarkers) && (hasQuestionMarkers || hasManipulationTactics);

    return {
      hasStoryMarkers,
      hasMotivationalContent: motivationalMatches.length > 0,
      motivationalWordCount: motivationalMatches.length,
      hasEducationalMarkers,
      hasQuestionMarkers,
      hasObviousBait,
      hasManipulationTactics,
      hasMixedSignals,
      detectedLanguage: language
    };
  }

  // Simple language detection for prompt selection
  detectLanguage(text) {
    const textLower = text.toLowerCase();

    // Simple heuristic-based language detection
    if (/\b(le|la|les|et|ou|mais|avec|de|ce|que|être|avoir)\b/.test(textLower)) {
      return 'fr';
    }
    if (/\b(el|la|los|las|y|o|pero|con|de|que|ser|tener)\b/.test(textLower)) {
      return 'es';
    }
    if (/\b(der|die|das|und|oder|aber|mit|von|dass|sein|haben)\b/.test(textLower)) {
      return 'de';
    }
    if (/\b(il|la|i|le|e|o|ma|con|di|che|essere|avere)\b/.test(textLower)) {
      return 'it';
    }
    if (/\b(o|a|os|as|e|ou|mas|com|de|que|ser|ter)\b/.test(textLower)) {
      return 'pt';
    }

    return 'en'; // Default to English
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
