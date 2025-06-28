// Language Support Module for ShutUpLinkedIn
// Handles multi-language bait detection patterns and localization

class LanguageSupport {
  constructor() {
    this.supportedLanguages = {
      'en': 'English',
      'fr': 'Français',
      'es': 'Español',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      'ar': 'العربية',
      'hi': 'हिन्दी'
    };

    // Language-specific bait patterns
    this.baitPatterns = {
      en: {
        directEngagement: [
          /agree\s*\?/i,
          /thoughts\s*\?/i,
          /what do you think\?/i,
          /am i (the only one|wrong|right)\?/i,
          /unpopular opinion/i,
          /hot take/i,
          /controversial/i,
          /change my mind/i,
          /fight me/i
        ],
        ctaPatterns: [
          /comment yes/i,
          /tag a friend/i,
          /dm me for/i,
          /send me a message/i,
          /like if you agree/i,
          /share if you/i,
          /repost if/i,
          /follow me for/i,
          /subscribe to/i,
          /check out my/i,
          /visit my/i,
          /link in bio/i,
          /click the link/i,
          /sign up for/i,
          /register now/i
        ],
        humbleBragging: [
          /blessed to announce/i,
          /humbled to share/i,
          /grateful to announce/i,
          /excited to share/i,
          /proud to announce/i
        ],
        urgencyPatterns: [
          /act now/i,
          /limited time/i,
          /don't miss/i,
          /last chance/i,
          /time sensitive/i,
          /going viral/i,
          /delete this post/i,
          /save it now/i
        ]
      },
      fr: {
        directEngagement: [
          /d'accord\s*\?/i,
          /votre avis\s*\?/i,
          /qu'en pensez-vous\s*\?/i,
          /suis-je le seul/i,
          /opinion impopulaire/i,
          /controvers[ée]/i,
          /changez mon avis/i,
          /battez-vous/i
        ],
        ctaPatterns: [
          /commentez oui/i,
          /taguez un ami/i,
          /envoyez-moi un message/i,
          /likez si vous/i,
          /partagez si/i,
          /repostez si/i,
          /suivez-moi pour/i,
          /abonnez-vous/i,
          /visitez mon/i,
          /lien en bio/i,
          /cliquez sur le lien/i,
          /inscrivez-vous/i
        ],
        humbleBragging: [
          /béni d'annoncer/i,
          /humble de partager/i,
          /reconnaissant d'annoncer/i,
          /ravi de partager/i,
          /fier d'annoncer/i
        ],
        urgencyPatterns: [
          /agissez maintenant/i,
          /temps limité/i,
          /ne ratez pas/i,
          /dernière chance/i,
          /urgent/i,
          /devient viral/i,
          /supprimer ce post/i,
          /sauvegardez maintenant/i
        ]
      },
      es: {
        directEngagement: [
          /de acuerdo\s*\?/i,
          /tu opinión\s*\?/i,
          /qué piensas\s*\?/i,
          /soy el único/i,
          /opinión impopular/i,
          /controversia/i,
          /cambia mi opinión/i,
          /pelea conmigo/i
        ],
        ctaPatterns: [
          /comenta sí/i,
          /etiqueta a un amigo/i,
          /envíame un mensaje/i,
          /dale like si/i,
          /comparte si/i,
          /repostea si/i,
          /sígueme para/i,
          /suscríbete/i,
          /visita mi/i,
          /enlace en bio/i,
          /haz clic en el enlace/i,
          /regístrate/i
        ],
        humbleBragging: [
          /bendecido de anunciar/i,
          /humilde de compartir/i,
          /agradecido de anunciar/i,
          /emocionado de compartir/i,
          /orgulloso de anunciar/i
        ],
        urgencyPatterns: [
          /actúa ahora/i,
          /tiempo limitado/i,
          /no te pierdas/i,
          /última oportunidad/i,
          /urgente/i,
          /se vuelve viral/i,
          /eliminar este post/i,
          /guárdalo ahora/i
        ]
      },
      de: {
        directEngagement: [
          /einverstanden\s*\?/i,
          /eure meinung\s*\?/i,
          /was denkt ihr\s*\?/i,
          /bin ich der einzige/i,
          /unpopuläre meinung/i,
          /kontrovers/i,
          /ändert meine meinung/i,
          /kämpft mit mir/i
        ],
        ctaPatterns: [
          /kommentiert ja/i,
          /markiert einen freund/i,
          /schreibt mir/i,
          /liked wenn ihr/i,
          /teilt wenn/i,
          /repostet wenn/i,
          /folgt mir für/i,
          /abonniert/i,
          /besucht mein/i,
          /link in bio/i,
          /klickt auf den link/i,
          /meldet euch an/i
        ],
        humbleBragging: [
          /gesegnet zu verkünden/i,
          /demütig zu teilen/i,
          /dankbar zu verkünden/i,
          /aufgeregt zu teilen/i,
          /stolz zu verkünden/i
        ],
        urgencyPatterns: [
          /handelt jetzt/i,
          /begrenzte zeit/i,
          /verpasst nicht/i,
          /letzte chance/i,
          /dringend/i,
          /wird viral/i,
          /lösche diesen post/i,
          /speichert es jetzt/i
        ]
      },
      it: {
        directEngagement: [
          /d'accordo\s*\?/i,
          /la vostra opinione\s*\?/i,
          /cosa ne pensate\s*\?/i,
          /sono l'unico/i,
          /opinione impopolare/i,
          /controverso/i,
          /cambiate la mia opinione/i,
          /combattete con me/i
        ],
        ctaPatterns: [
          /commentate sì/i,
          /taggate un amico/i,
          /mandatemi un messaggio/i,
          /mettete like se/i,
          /condividete se/i,
          /ripostate se/i,
          /seguitemi per/i,
          /iscrivetevi/i,
          /visitate il mio/i,
          /link in bio/i,
          /cliccate sul link/i,
          /registratevi/i
        ],
        humbleBragging: [
          /benedetto di annunciare/i,
          /umile di condividere/i,
          /grato di annunciare/i,
          /emozionato di condividere/i,
          /orgoglioso di annunciare/i
        ],
        urgencyPatterns: [
          /agite ora/i,
          /tempo limitato/i,
          /non perdete/i,
          /ultima possibilità/i,
          /urgente/i,
          /diventa virale/i,
          /cancello questo post/i,
          /salvatelo ora/i
        ]
      },
      pt: {
        directEngagement: [
          /concordam\s*\?/i,
          /vossa opinião\s*\?/i,
          /o que acham\s*\?/i,
          /sou o único/i,
          /opinião impopular/i,
          /controverso/i,
          /mudem a minha opinião/i,
          /lutem comigo/i
        ],
        ctaPatterns: [
          /comentem sim/i,
          /marquem um amigo/i,
          /mandem-me mensagem/i,
          /curtam se/i,
          /partilhem se/i,
          /repostem se/i,
          /sigam-me para/i,
          /subscrevam/i,
          /visitem o meu/i,
          /link na bio/i,
          /cliquem no link/i,
          /registrem-se/i
        ],
        humbleBragging: [
          /abençoado de anunciar/i,
          /humilde de partilhar/i,
          /grato de anunciar/i,
          /emocionado de partilhar/i,
          /orgulhoso de anunciar/i
        ],
        urgencyPatterns: [
          /ajam agora/i,
          /tempo limitado/i,
          /não percam/i,
          /última hipótese/i,
          /urgente/i,
          /fica viral/i,
          /apago este post/i,
          /guardem agora/i
        ]
      }
    };

    // Common motivational/buzzwords by language
    this.motivationalWords = {
      en: ['success', 'journey', 'mindset', 'growth', 'hustle', 'grind', 'passion', 'dreams', 'goals', 'inspire', 'motivation', 'believe', 'manifest', 'abundance', 'grateful', 'blessed', 'universe'],
      fr: ['succès', 'voyage', 'mentalité', 'croissance', 'passion', 'rêves', 'objectifs', 'inspirer', 'motivation', 'croire', 'manifester', 'abondance', 'reconnaissant', 'béni', 'univers'],
      es: ['éxito', 'viaje', 'mentalidad', 'crecimiento', 'pasión', 'sueños', 'objetivos', 'inspirar', 'motivación', 'creer', 'manifestar', 'abundancia', 'agradecido', 'bendecido', 'universo'],
      de: ['erfolg', 'reise', 'denkweise', 'wachstum', 'leidenschaft', 'träume', 'ziele', 'inspirieren', 'motivation', 'glauben', 'manifestieren', 'fülle', 'dankbar', 'gesegnet', 'universum'],
      it: ['successo', 'viaggio', 'mentalità', 'crescita', 'passione', 'sogni', 'obiettivi', 'ispirare', 'motivazione', 'credere', 'manifestare', 'abbondanza', 'grato', 'benedetto', 'universo'],
      pt: ['sucesso', 'viagem', 'mentalidade', 'crescimento', 'paixão', 'sonhos', 'objetivos', 'inspirar', 'motivação', 'acreditar', 'manifestar', 'abundância', 'grato', 'abençoado', 'universo']
    };

    // Language-specific emoji patterns
    this.emojiPatterns = {
      high_engagement: /[\u{1F525}\u{1F37F}\u{2764}\u{FE0F}\u{1F494}\u{1F4A5}\u{26A1}\u{1F680}]/u,
      pointing: /[\u{1F447}\u{1F448}\u{1F449}\u{1F446}]/u,
      celebration: /[\u{1F389}\u{1F38A}\u{1F973}\u{1F3C6}]/u,
      money: /[\u{1F4B0}\u{1F4B5}\u{1F4B8}\u{1F4B4}\u{1F4B7}]/u
    };

    // Regional patterns for different LinkedIn markets
    this.regionalPatterns = {
      'US': {
        professional: /\b(CEO|VP|Director|Manager|Lead|Senior|Principal)\b/i,
        companies: /\b(Google|Meta|Amazon|Microsoft|Apple|Netflix|Tesla)\b/i
      },
      'EU': {
        professional: /\b(Managing Director|Head of|Chief|Directeur|Direktor|Direttore)\b/i,
        companies: /\b(SAP|ASML|Spotify|Adidas|BMW|Siemens|LVMH)\b/i
      },
      'LATAM': {
        professional: /\b(Gerente|Director|Jefe|Líder|Senior|Principal)\b/i,
        companies: /\b(Mercado Libre|Globo|Banco do Brasil|CEMEX|América Móvil)\b/i
      }
    };
  }

  // Detect language of a text
  detectLanguage(text) {
    if (!text || text.trim().length < 10) {
      return 'en'; // Default to English for short texts
    }

    const textLower = text.toLowerCase();
    const scores = {};

    // Initialize scores
    Object.keys(this.baitPatterns).forEach(lang => {
      scores[lang] = 0;
    });

    // Score based on language-specific patterns
    Object.keys(this.baitPatterns).forEach(lang => {
      const patterns = this.baitPatterns[lang];

      // Check each pattern category
      Object.values(patterns).flat().forEach(pattern => {
        if (pattern.test(text)) {
          scores[lang] += 2;
        }
      });

      // Check motivational words
      if (this.motivationalWords[lang]) {
        this.motivationalWords[lang].forEach(word => {
          if (textLower.includes(word)) {
            scores[lang] += 1;
          }
        });
      }
    });

    // Additional heuristics for language detection
    if (/\b(the|and|or|but|with|from|they|this|that|have|will|would|could|should)\b/.test(textLower)) {
      scores.en += 3;
    }
    if (/\b(le|la|les|et|ou|mais|avec|de|ils|ce|que|avoir|sera|pourrait|devrait)\b/.test(textLower)) {
      scores.fr += 3;
    }
    if (/\b(el|la|los|las|y|o|pero|con|de|ellos|esto|que|tener|será|podría|debería)\b/.test(textLower)) {
      scores.es += 3;
    }
    if (/\b(der|die|das|und|oder|aber|mit|von|sie|dies|dass|haben|wird|könnte|sollte)\b/.test(textLower)) {
      scores.de += 3;
    }
    if (/\b(il|la|i|le|e|o|ma|con|di|loro|questo|che|avere|sarà|potrebbe|dovrebbe)\b/.test(textLower)) {
      scores.it += 3;
    }
    if (/\b(o|a|os|as|e|ou|mas|com|de|eles|isto|que|ter|será|poderia|deveria)\b/.test(textLower)) {
      scores.pt += 3;
    }

    // Find language with highest score
    const detectedLang = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    // Return detected language if score is significant, otherwise default to English
    return scores[detectedLang] > 2 ? detectedLang : 'en';
  }

  // Get language-specific bait patterns
  getBaitPatterns(language = 'en') {
    return this.baitPatterns[language] || this.baitPatterns.en;
  }

  // Get motivational words for a language
  getMotivationalWords(language = 'en') {
    return this.motivationalWords[language] || this.motivationalWords.en;
  }

  // Score text using language-specific patterns
  scoreTextByLanguage(text, language = null) {
    const detectedLang = language || this.detectLanguage(text);
    const patterns = this.getBaitPatterns(detectedLang);
    const motivationalWords = this.getMotivationalWords(detectedLang);

    let score = 0;

    // Check each pattern category
    Object.values(patterns).flat().forEach(pattern => {
      if (pattern.test(text)) {
        score += 1;
      }
    });

    // Check motivational word density
    const textLower = text.toLowerCase();
    const motivationalCount = motivationalWords.filter(word =>
      textLower.includes(word)
    ).length;

    if (motivationalCount >= 3) {
      score += motivationalCount * 0.5;
    }

    // Check emoji patterns
    Object.values(this.emojiPatterns).forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.5;
      }
    });

    return {
      score,
      language: detectedLang,
      patterns: patterns,
      motivationalWords: motivationalWords
    };
  }

  // Get supported languages list
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Check if language is supported
  isLanguageSupported(language) {
    return language in this.supportedLanguages;
  }

  // Get language name
  getLanguageName(language) {
    return this.supportedLanguages[language] || 'Unknown';
  }

  // Get regional patterns
  getRegionalPatterns(region = 'US') {
    return this.regionalPatterns[region] || this.regionalPatterns.US;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageSupport;
} else if (typeof window !== 'undefined') {
  window.LanguageSupport = LanguageSupport;
}
