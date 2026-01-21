# WordPress Interactivity API Helper

Intelligent autocomplete and validation for WordPress Interactivity API directives in VSCode.

## Features

- 🎯 **Directive Autocomplete**: Get intelligent suggestions for all `data-wp-*` directives as you type
- ⚠️ **Duplicate Detection**: Warnings for improperly duplicated directives on the same element
- 🔍 **Context-Aware Value Suggestions**: Autocomplete for state, context, actions, and callbacks based on detected stores
- 📁 **Directory-Scoped Store Detection**: Automatically discovers store definitions from PHP and JavaScript files in the same directory
- 📝 **Inline Context Parsing**: Suggests properties from inline `data-wp-context` attributes

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 in VSCode to launch the extension in development mode

## Usage

### Directive Autocomplete

Simply start typing `data-` in any HTML attribute position within PHP or HTML files:

```html
<div data-wp-interactive="myPlugin">
  <button data-wp-on--click="actions.toggle">
    <!-- Autocomplete will suggest all available directives -->
  </button>
</div>
```

### Value Suggestions

When writing directive values, the extension will suggest available properties from your stores:

```html
<div data-wp-interactive="myPlugin">
  <span data-wp-text="state.">
    <!-- Autocomplete will show all state properties from myPlugin store -->
  </span>
</div>
```

### Store Detection

The extension automatically scans PHP and JavaScript files in the same directory for store definitions:

**PHP:**
```php
wp_interactivity_state('myPlugin', array(
    'counter' => 0,
    'isOpen' => false
));
```

**JavaScript:**
```javascript
import { store } from '@wordpress/interactivity';

store('myPlugin', {
    state: {
        counter: 0,
        isOpen: false
    },
    actions: {
        toggle: () => { /* ... */ }
    }
});
```

## Configuration

Configure the extension through VSCode settings:

- `wpInteractivityAPI.enableDirectiveCompletion`: Enable/disable directive autocomplete (default: `true`)
- `wpInteractivityAPI.enableValueCompletion`: Enable/disable value autocomplete (default: `true`)
- `wpInteractivityAPI.enableDuplicateWarnings`: Show warnings for duplicate directives (default: `true`)
- `wpInteractivityAPI.parseInlineContexts`: Parse inline context attributes for suggestions (default: `true`)

## Supported Directives

### Core
- `data-wp-interactive` - Activates interactivity and defines namespace
- `data-wp-context` - Provides local state

### Attributes
- `data-wp-bind--[attribute]` - Sets HTML attributes dynamically
- `data-wp-class--[className]` - Toggles CSS classes
- `data-wp-style--[property]` - Applies inline styles
- `data-wp-text` - Sets text content

### Events
- `data-wp-on--[event]` - Attaches event listeners
- `data-wp-on-async--[event]` - Async event handlers
- `data-wp-on-window--[event]` - Window event listeners
- `data-wp-on-async-window--[event]` - Async window events
- `data-wp-on-document--[event]` - Document event listeners
- `data-wp-on-async-document--[event]` - Async document events

### Side Effects
- `data-wp-watch` - Runs on creation and state changes
- `data-wp-init` - Runs once on element creation
- `data-wp-run` - Executes during render

### Lists
- `data-wp-key` - Assigns unique keys for list items
- `data-wp-each` - Renders lists from arrays
- `data-wp-each-child` - Designates child elements in loops

## Development

### Building

```bash
npm run compile      # Development build
npm run watch        # Watch mode
npm run package      # Production build
```

### Testing

```bash
npm test
```

## Requirements

- VSCode 1.85.0 or higher
- WordPress 6.5+ or Gutenberg 17.5+

## Release Notes

### 0.1.0

Initial release with basic directive autocomplete, duplicate detection, and store parsing.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT
