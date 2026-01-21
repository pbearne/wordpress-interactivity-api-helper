# Changelog

All notable changes to the "WordPress Interactivity API Helper" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Unit tests for parsers
- Integration tests for completion providers
- Hover documentation for directives
- Go to definition for store properties
- Snippet library for common patterns
- Performance optimizations

## [0.1.0] - Initial Release

### Added
- ✨ Directive autocomplete for all 21 WordPress Interactivity API directives
- ✨ Context-aware value suggestions (state, context, actions, callbacks)
- ✨ PHP store parser for `wp_interactivity_state()` calls
- ✨ JavaScript store parser for `store()` calls from `@wordpress/interactivity`
- ✨ Inline context parser for `data-wp-context` attributes
- ✨ Duplicate directive validation with warnings
- ✨ Directory-scoped store scanning for performance
- ⚙️ Configuration options for all features
- 🔧 Commands: "Refresh Store Cache" and "Show Available Stores"

### Supported Directives
**Core:**
- `data-wp-interactive` - Namespace activation
- `data-wp-context` - Local state

**Attributes:**
- `data-wp-bind--[attribute]` - Dynamic attributes
- `data-wp-class--[className]` - CSS class toggling
- `data-wp-style--[property]` - Inline styles
- `data-wp-text` - Text content

**Events:**
- `data-wp-on--[event]` - Event handlers
- `data-wp-on-async--[event]` - Async event handlers
- `data-wp-on-window--[event]` - Window events
- `data-wp-on-async-window--[event]` - Async window events
- `data-wp-on-document--[event]` - Document events
- `data-wp-on-async-document--[event]` - Async document events

**Side Effects:**
- `data-wp-watch` - State change reactions
- `data-wp-init` - Initialization callbacks
- `data-wp-run` - Render execution

**Lists:**
- `data-wp-key` - List item keys
- `data-wp-each` - List iteration
- `data-wp-each-child` - Child iteration markers

### Technical Details
- Built with TypeScript 5.3
- Webpack 5 bundling
- PHP parsing via php-parser
- JavaScript parsing via @babel/parser
- HTML parsing via node-html-parser
- Directory-scoped scanning for performance
- Support for WordPress 6.5+

---

## Version History Guidelines

### Version Format
- **Major.Minor.Patch** (e.g., 1.2.3)
- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes
