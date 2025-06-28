// ShutUpLinkedIn - Stealth Module
// Anti-detection measures to avoid LinkedIn restrictions

class StealthMode {
  constructor() {
    this.isActive = true;
    this.detectionCounters = {
      domModifications: 0,
      rapidClicks: 0,
      suspiciousPatterns: 0
    };

    // Randomization settings
    this.timing = {
      minDelay: 500,
      maxDelay: 3000,
      scanInterval: 2000 + Math.random() * 2000
    };

    this.init();
  }

  init() {
    this.setupAntiDetection();
    this.randomizeTimings();
    this.monitorDetectionRisk();
  }

  // Main stealth wrapper for DOM operations
  async stealthOperation(operation, context = 'general') {
    if (!this.isActive) return operation();

    // Add human-like delay
    await this.humanDelay();

    // Check if we should pause operations
    if (this.shouldPauseOperations()) {
      console.log('ShutUpLinkedIn: Pausing operations due to detection risk');
      await this.extendedPause();
    }

    // Execute operation with monitoring
    this.detectionCounters.domModifications++;

    try {
      const result = await operation();
      this.recordSuccessfulOperation(context);
      return result;
    } catch (error) {
      this.recordFailedOperation(context, error);
      throw error;
    }
  }

  // Human-like timing delays
  async humanDelay(baseDelay = null) {
    const delay = baseDelay || (this.timing.minDelay + Math.random() * (this.timing.maxDelay - this.timing.minDelay));

    // Add micro-variations to make it more human-like
    const variation = (Math.random() - 0.5) * 200;
    const finalDelay = Math.max(100, delay + variation);

    return new Promise(resolve => setTimeout(resolve, finalDelay));
  }

  // Check if operations should be paused
  shouldPauseOperations() {
    const now = Date.now();
    const recentOperations = this.detectionCounters.domModifications;

    // Pause if too many operations in short time
    if (recentOperations > 20) {
      return true;
    }

    // Pause during peak detection hours (when LinkedIn might be more vigilant)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17 && Math.random() < 0.1) {
      return true;
    }

    return false;
  }

  // Extended pause when detection risk is high
  async extendedPause() {
    const pauseDuration = 5000 + Math.random() * 10000; // 5-15 seconds
    await new Promise(resolve => setTimeout(resolve, pauseDuration));

    // Reset counters after pause
    this.detectionCounters.domModifications = 0;
  }

  // Randomize operation timings
  randomizeTimings() {
    setInterval(() => {
      this.timing.scanInterval = 2000 + Math.random() * 3000;
      this.timing.minDelay = 300 + Math.random() * 500;
      this.timing.maxDelay = 2000 + Math.random() * 2000;
    }, 60000); // Update every minute
  }

  // Setup anti-detection measures
  setupAntiDetection() {
    // Hide extension traces
    this.hideExtensionTraces();

    // Randomize CSS class names
    this.randomizeClassNames();

    // Monitor for LinkedIn's detection scripts
    this.monitorLinkedInDetection();
  }

  // Hide obvious extension traces
  hideExtensionTraces() {
    // Remove or obfuscate obvious extension markers
    const style = document.createElement('style');
    style.textContent = `
      /* Hide extension elements from potential detection */
      .shutup-hidden {
        display: none !important;
        visibility: hidden !important;
      }

      .shutup-replacement {
        /* Make replacement elements look more native */
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f8f9fa;
        margin: 8px 0;
        transition: all 0.2s ease;
      }

      /* Reduce visual footprint */
      .shutup-replacement:hover {
        background: #f0f2f5;
      }
    `;

    // Append with random delay to avoid detection
    setTimeout(() => {
      document.head.appendChild(style);
    }, Math.random() * 1000);
  }

  // Use randomized class names to avoid detection
  randomizeClassNames() {
    this.classNames = {
      hidden: `ln-${this.generateRandomString(8)}`,
      replacement: `ln-${this.generateRandomString(8)}`,
      button: `ln-${this.generateRandomString(8)}`
    };
  }

  // Generate random string for class names
  generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Monitor for LinkedIn's detection attempts
  monitorLinkedInDetection() {
    // Watch for suspicious DOM queries that might be detection attempts
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;

    document.querySelector = function(...args) {
      // Log potential detection attempts
      if (args[0] && typeof args[0] === 'string') {
        if (args[0].includes('shutup') || args[0].includes('extension')) {
          console.warn('Potential detection attempt:', args[0]);
        }
      }
      return originalQuerySelector.apply(this, args);
    };
  }

  // Simulate human behavior patterns
  simulateHumanBehavior() {
    // Occasionally scroll to make activity look natural
    if (Math.random() < 0.1) {
      this.simulateScroll();
    }

    // Random mouse movements (simulated through focus changes)
    if (Math.random() < 0.05) {
      this.simulateMouseActivity();
    }
  }

  async simulateScroll() {
    const scrollAmount = Math.random() * 200 + 100;
    const currentScroll = window.scrollY;

    window.scrollTo({
      top: currentScroll + scrollAmount,
      behavior: 'smooth'
    });

    await this.humanDelay(500);

    // Sometimes scroll back
    if (Math.random() < 0.3) {
      window.scrollTo({
        top: currentScroll,
        behavior: 'smooth'
      });
    }
  }

  simulateMouseActivity() {
    // Simulate focus changes to mimic mouse movement
    const focusableElements = document.querySelectorAll('a, button, input, [tabindex]');
    if (focusableElements.length > 0) {
      const randomElement = focusableElements[Math.floor(Math.random() * focusableElements.length)];
      randomElement.focus();
      setTimeout(() => randomElement.blur(), 100 + Math.random() * 200);
    }
  }

  // Monitor detection risk levels
  monitorDetectionRisk() {
    setInterval(() => {
      const riskLevel = this.calculateDetectionRisk();

      if (riskLevel > 0.7) {
        console.warn('ShutUpLinkedIn: High detection risk, reducing activity');
        this.isActive = false;

        // Reactivate after cooldown
        setTimeout(() => {
          this.isActive = true;
          this.resetCounters();
        }, 30000 + Math.random() * 30000);
      }
    }, 10000);
  }

  calculateDetectionRisk() {
    let risk = 0;

    // Factor in operation frequency
    if (this.detectionCounters.domModifications > 50) risk += 0.3;
    if (this.detectionCounters.rapidClicks > 10) risk += 0.2;

    // Factor in time patterns
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) risk += 0.1; // Business hours

    // Factor in page activity
    const hiddenElements = document.querySelectorAll('.shutup-hidden').length;
    if (hiddenElements > 20) risk += 0.2;

    return Math.min(risk, 1.0);
  }

  recordSuccessfulOperation(context) {
    // Track successful operations for pattern analysis
    if (!this.operationLog) this.operationLog = [];

    this.operationLog.push({
      context,
      timestamp: Date.now(),
      success: true
    });

    // Keep only recent entries
    if (this.operationLog.length > 100) {
      this.operationLog = this.operationLog.slice(-50);
    }
  }

  recordFailedOperation(context, error) {
    this.detectionCounters.suspiciousPatterns++;
    console.warn(`ShutUpLinkedIn: Operation failed in ${context}:`, error);
  }

  resetCounters() {
    this.detectionCounters = {
      domModifications: 0,
      rapidClicks: 0,
      suspiciousPatterns: 0
    };
  }

  // Get current stealth status
  getStatus() {
    return {
      active: this.isActive,
      riskLevel: this.calculateDetectionRisk(),
      counters: { ...this.detectionCounters },
      timings: { ...this.timing }
    };
  }

  // Emergency shutdown
  emergencyShutdown() {
    this.isActive = false;
    console.log('ShutUpLinkedIn: Emergency shutdown activated');

    // Hide all extension elements
    const extensionElements = document.querySelectorAll('[class*="shutup"]');
    extensionElements.forEach(el => {
      el.style.display = 'none';
    });

    // Clear all intervals and timeouts
    for (let i = 1; i < 99999; i++) window.clearInterval(i);
  }
}

// Global stealth instance
window.stealthMode = new StealthMode();
