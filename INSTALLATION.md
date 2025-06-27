# Installation Guide

## Prerequisites

- Google Chrome browser (version 88 or higher)
- Basic understanding of Chrome extension installation

## Method 1: Load Unpacked (Development)

This is the current method since the extension isn't published yet.

### Step 1: Download the Extension

```bash
git clone https://github.com/ismaelfi/shutuplinkedin.git
cd shutuplinkedin
```

Or download the ZIP file and extract it.

### Step 2: Open Chrome Extensions Page

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Or go to Chrome menu → More tools → Extensions

### Step 3: Enable Developer Mode

1. In the top-right corner, toggle **"Developer mode"** ON
2. This will show additional buttons

### Step 4: Load the Extension

1. Click **"Load unpacked"** button
2. Browse to and select the `shutuplinkedin` folder
3. Click **"Select Folder"** (or **"Open"** on Mac)

### Step 5: Verify Installation

1. The extension should appear in your extensions list
2. You should see a 🤫 icon in your Chrome toolbar
3. Navigate to LinkedIn.com to test

## Method 2: Chrome Web Store (Coming Soon)

*This extension will be available on the Chrome Web Store once it's reviewed and approved.*

## Permissions Explained

The extension requests these permissions:

- **Storage**: To save your settings and statistics
- **ActiveTab**: To analyze content on LinkedIn pages
- **Host permissions (linkedin.com)**: To run only on LinkedIn

## Troubleshooting

### Extension Not Working
1. **Refresh LinkedIn**: Close and reopen LinkedIn tabs
2. **Check Console**: Open Developer Tools (F12) and check for errors
3. **Reload Extension**: Go to chrome://extensions/ and click the reload button

### Permission Errors
1. Make sure you granted all requested permissions
2. Try removing and re-adding the extension

### Posts Not Being Hidden
1. Check if the extension is enabled (click the toolbar icon)
2. Try adjusting the aggressiveness level to "High"
3. Some new LinkedIn UI changes might require updates

### Performance Issues
1. The extension is lightweight, but check Chrome's Task Manager
2. Report any specific performance problems

## Updating the Extension

For development installations:
1. Pull latest changes: `git pull origin main`
2. Go to chrome://extensions/
3. Click the reload button for ShutUpLinkedIn

## Uninstalling

1. Go to chrome://extensions/
2. Find ShutUpLinkedIn
3. Click **"Remove"**
4. Confirm removal

Your settings and statistics will be deleted.

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/ismaelfi/shutuplinkedin/issues)
- **Email**: [ismael@mvpable.com](mailto:ismael@mvpable.com)

## Privacy Note

This extension:
- ✅ Processes everything locally in your browser
- ✅ Never sends your data to external servers
- ✅ Doesn't track your browsing
- ✅ Only works on LinkedIn.com

Your privacy is our priority.
