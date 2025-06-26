# 🤫 ShutUpLinkedIn

A smart Chrome extension that automatically detects and hides low-value, engagement-bait posts on LinkedIn. It uses pattern recognition, heuristics, and lightweight AI to clean up your feed — so you only see content that's genuinely worth your time.

Instead of manually muting people or scrolling endlessly through clout-chasing nonsense, ShutUpLinkedIn does it for you. Quietly. Relentlessly. Automatically.

## Features

- **Smart Detection**: Uses advanced pattern recognition to identify engagement bait, humble bragging, fake stories, and motivational spam
- **Configurable Aggressiveness**: Choose from Low, Medium, or High filtering levels based on your preferences
- **Non-Destructive**: Hidden posts can always be revealed with a click if you want to see them
- **Privacy-First**: All processing happens locally in your browser - no data is sent to external servers
- **Lightweight**: Minimal performance impact on LinkedIn's interface
- **Real-time Stats**: Track how many low-value posts have been filtered from your feed

## What Gets Filtered

ShutUpLinkedIn detects and hides posts containing:

### Engagement Bait
- "Agree?" / "Thoughts?" posts
- "Am I the only one who..." questions
- "Unpopular opinion" / "Hot take" statements
- "Change my mind" challenges

### Humble Bragging
- "Blessed to announce..."
- "Humbled to share..."
- "Grateful to announce..."

### Generic Motivational Spam
- Life lesson posts
- "Success secrets" and "millionaire mindset" content
- Generic inspirational quotes without context
- Excessive motivational buzzwords

### Low-Value Indicators
- Excessive emoji usage
- All-caps words and excessive punctuation
- Corporate buzzword soup (synergy, disrupt, leverage, etc.)
- Fake urgency ("Act now!", "Limited time!")

### Fake Stories
- Obviously fabricated personal anecdotes
- "True story" markers
- "You won't believe what happened" posts

## Installation

### From Chrome Web Store (Recommended)
*Coming soon - extension is currently in development*

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar
6. Navigate to LinkedIn and enjoy a cleaner feed!

## Usage

1. **Install the extension** and grant permissions for LinkedIn
2. **Visit LinkedIn** - the extension automatically starts filtering your feed
3. **Adjust settings** by clicking the extension icon in your toolbar
4. **View hidden posts** by clicking "Show anyway" on any filtered post
5. **Track your stats** to see how much noise has been filtered out

## Settings

- **Enable/Disable**: Turn filtering on or off completely
- **Aggressiveness Level**:
  - **Low**: Only filters obvious spam and engagement bait
  - **Medium**: Balanced filtering (recommended for most users)
  - **High**: Aggressive filtering of questionable content
- **Show Stats**: Display a counter of hidden posts
- **Reset Stats**: Clear your hidden post counter

## Privacy & Security

- **100% Local Processing**: All content analysis happens in your browser
- **No Data Collection**: We don't collect, store, or transmit any of your data
- **No External Servers**: The extension doesn't communicate with any external services
- **Minimal Permissions**: Only requests access to LinkedIn domains
- **Open Source**: Full source code is available for review

## Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Found a post that should be filtered but wasn't? Report it!
2. **Suggest Patterns**: Know of common LinkedIn spam patterns we're missing?
3. **Code Contributions**: Submit pull requests for improvements
4. **Testing**: Help test new features and edge cases

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ismaelfi/shutuplinkedin.git
cd shutuplinkedin

# Load in Chrome for testing
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this directory
```

## How It Works

ShutUpLinkedIn uses a multi-layered approach to content analysis:

1. **Pattern Matching**: Regex patterns detect common engagement bait phrases
2. **Heuristic Analysis**: Examines post structure, length, punctuation patterns
3. **Content Scoring**: Assigns spam scores based on multiple factors
4. **Threshold Filtering**: Hides posts above configured spam threshold
5. **User Override**: Always allows manual revelation of hidden content

## Roadmap

- [ ] Machine learning-based detection improvements
- [ ] Whitelist for trusted authors
- [ ] Custom filter rules
- [ ] Export/import settings
- [ ] Advanced analytics dashboard
- [ ] Support for other social platforms

## FAQ

**Q: Will this break LinkedIn's functionality?**
A: No, the extension only hides posts visually. All LinkedIn features continue to work normally.

**Q: Can I see what was hidden?**
A: Yes! Each hidden post shows a preview and "Show anyway" button to reveal the full content.

**Q: Does this affect my LinkedIn algorithm?**
A: No, posts are only hidden visually. LinkedIn's algorithm doesn't know the extension exists.

**Q: Can I customize what gets filtered?**
A: Currently you can adjust the aggressiveness level. Custom rules are planned for a future update.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/ismaelfi/shutuplinkedin/issues)

---

*Made with ❤️ for everyone tired of LinkedIn's descent into engagement-bait hell.*
