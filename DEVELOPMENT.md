# Development Guide

## Quick Start

### Testing the Extension

1. **Open in VSCode**: Open this folder in VSCode
2. **Press F5**: This will compile and launch the extension in a new Extension Development Host window
3. **Test in the host window**: Create or open a PHP or HTML file and test the autocomplete features

### Development Workflow

```bash
# Watch mode for development (auto-recompile on changes)
npm run watch

# Compile once
npm run compile

# Production build
npm run package

# Lint code
npm run lint
```

### Testing Features

#### 1. Directive Autocomplete

Create a test file `test.php`:

```php
<?php
?>
<div data-wp-interactive="myPlugin">
    <button data-
        <!-- Type "data-" and autocomplete should appear -->
    </button>
</div>
```

#### 2. Value Autocomplete

First create a store definition in the same directory:

**view.js:** (or view.ts - WordPress Interactivity API standard filename)
```javascript
import { store } from '@wordpress/interactivity';

store('myPlugin', {
    state: {
        counter: 0,
        isOpen: false
    },
    actions: {
        toggle: () => {
            // Toggle logic
        }
    },
    callbacks: {
        logToConsole: () => {
            console.log('callback executed');
        }
    }
});
```

**test.php:**
```php
<div data-wp-interactive="myPlugin">
    <span data-wp-text="state.">
        <!-- Type "state." and you should see counter and isOpen -->
    </span>
    <button data-wp-on--click="actions.">
        <!-- Type "actions." and you should see toggle -->
    </button>
</div>
```

#### 3. Inline Context Parsing

```php
<div data-wp-interactive="myPlugin"
     data-wp-context='{"postId": 123, "isActive": true}'>
    <span data-wp-text="context.">
        <!-- Should suggest postId and isActive -->
    </span>
</div>
```

#### 4. Duplicate Detection

```php
<div data-wp-interactive="myPlugin">
    <!-- This should show a warning: -->
    <div data-wp-text="state.value"
         data-wp-text="state.anotherValue">
    </div>
</div>
```

### Extension Commands

Access these via Command Palette (Cmd+Shift+P / Ctrl+Shift+P):

- **WordPress Interactivity API: Refresh Store Cache** - Manually refresh detected stores
- **WordPress Interactivity API: Show Available Stores** - Display all discovered stores

### Configuration

Test configuration changes in VSCode settings:

```json
{
    "wpInteractivityAPI.enableDirectiveCompletion": true,
    "wpInteractivityAPI.enableValueCompletion": true,
    "wpInteractivityAPI.enableDuplicateWarnings": true,
    "wpInteractivityAPI.parseInlineContexts": true
}
```

## Debugging

### Console Logs

The extension includes comprehensive logging. Check the **Debug Console** in the Extension Development Host for detailed logs:

1. **Store Scanning**:
   ```
   [WP Interactivity API] Scanning directory: /path/to/directory
   [WP Interactivity API] Found files: { php: 1, js: 2, jsFiles: ['view.js', 'index.js'] }
   [WP Interactivity API] Parsing file: view.js type: .js
   [WP Interactivity API] JS stores found: 1
   [WP Interactivity API] Total stores found: 1
   [WP Interactivity API] Store: myPlugin { state: ['counter', 'isOpen'], actions: ['toggle'], callbacks: [] }
   ```

2. **Value Completion**:
   ```
   [WP Interactivity API] Value completion - namespace: myPlugin type: state prefix:
   [WP Interactivity API] Store lookup result: found
   ```

3. **Troubleshooting**:
   - If you see "JS stores found: 0" - Check your store() syntax
   - If you see "No namespace found" - Add `data-wp-interactive="namespace"` to your HTML
   - If you see "Store lookup result: not found" - Check the namespace matches

### Breakpoints

Set breakpoints in TypeScript files (in `src/` folder, not `dist/`) and use F5 to debug.

### Testing Commands

Run these commands in the Extension Development Host:
- **Cmd+Shift+P** → "WordPress Interactivity API: Show Available Stores" - See what stores were detected
- **Cmd+Shift+P** → "WordPress Interactivity API: Refresh Store Cache" - Force rescan

## Project Structure

```
src/
├── extension.ts              # Entry point
├── constants/
│   └── directives.ts         # All directive definitions
├── models/
│   ├── directive.ts          # Type definitions
│   └── store.ts              # Store type definitions
├── parsers/
│   ├── storeParser.ts        # Store registry
│   ├── phpStoreParser.ts     # PHP wp_interactivity_state parser
│   ├── jsStoreParser.ts      # JS store() parser
│   └── contextParser.ts      # Inline context parser
├── providers/
│   ├── directiveCompletionProvider.ts  # Directive autocomplete
│   └── valueCompletionProvider.ts      # Value autocomplete
├── utils/
│   ├── htmlParser.ts         # HTML parsing utilities
│   ├── documentParser.ts     # Document context detection
│   └── workspaceScanner.ts   # Directory-scoped file scanning
└── validators/
    └── duplicateValidator.ts # Duplicate detection
```

## Common Issues

### Extension Not Activating

- Check that you're working with PHP or HTML files
- Extension only activates for these language IDs

### Autocomplete Not Appearing

- Ensure you're in an HTML attribute context
- Check that configuration settings are enabled
- Try manually refreshing store cache

### Store Not Detected

- **Most Important**: The JS file must be in the **same directory** as your PHP/HTML template
- Common filenames: `view.js`, `view.ts`, `index.js`, or any `.js`/`.ts` file
- Use "Show Available Stores" command to see what stores were detected
- Check Debug Console for detailed parsing logs:
  - Look for `[WP Interactivity API] Found files` - confirms files were found
  - Look for `[WP Interactivity API] JS stores found: X` - confirms parsing
  - Look for `[WP Interactivity API] Store: namespace` - confirms registration
- If you see "JS stores found: 0", check your JavaScript syntax:
  ```javascript
  // ✅ Correct
  import { store } from '@wordpress/interactivity';
  store('myPlugin', { state: {}, actions: {} });

  // ❌ Won't be detected
  const myStore = store('myPlugin', {});  // Variable assignment
  export default store('myPlugin', {});    // Export statement
  ```

## Next Steps

For adding new features or modifications, refer to the implementation plan at:
`.claude/plans/breezy-gliding-nova.md`

## Publishing

When ready to publish:

```bash
# Install vsce (once)
npm install -g @vscode/vsce

# Package extension
vsce package

# This creates a .vsix file you can install or publish
```
