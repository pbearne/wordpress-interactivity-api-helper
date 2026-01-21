# Contributing Guide

This guide will help you get started with development on any machine.

## Prerequisites

- Node.js 20.x or higher
- VSCode 1.85.0 or higher
- Git

## Initial Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd iapi-vscode-helper
   npm install
   ```

2. **Open in VSCode**
   ```bash
   code .
   ```

3. **Build the Extension**
   ```bash
   npm run compile
   # Or for watch mode:
   npm run watch
   ```

4. **Run Extension**
   - Press `F5` in VSCode
   - This will compile and launch the Extension Development Host

## Development Workflow

### VSCode Configuration Included

The `.vscode/` folder contains:
- **launch.json**: Debugging configurations
- **tasks.json**: Build tasks (compile, watch)
- **settings.json**: Workspace settings
- **extensions.json**: Recommended extensions

These ensure consistent development experience across machines.

### Key Commands

| Command | Description |
|---------|-------------|
| `F5` | Launch Extension Development Host |
| `Cmd/Ctrl+Shift+B` | Run build task |
| `npm run watch` | Auto-recompile on file changes |
| `npm run compile` | One-time compilation |
| `npm run package` | Production build |
| `npm run lint` | Run ESLint |

## Project State

### Current Implementation Status

✅ **Completed Features:**
- [x] Directive autocomplete (all 21 directives)
- [x] Value autocomplete (state/context/actions/callbacks)
- [x] PHP store parser (`wp_interactivity_state()`)
- [x] JavaScript store parser (`store()`)
- [x] Inline context parser (`data-wp-context`)
- [x] Duplicate directive validation
- [x] Directory-scoped store scanning
- [x] Extension configuration settings
- [x] Commands (refresh cache, show stores)

📋 **TODO / Future Enhancements:**
- [ ] Unit tests for parsers
- [ ] Integration tests for completion providers
- [ ] Hover documentation for directives
- [ ] Go to definition for store properties
- [ ] Snippet library for common patterns
- [ ] Performance testing with large projects
- [ ] Marketplace preparation and publishing

### Implementation Plan

The complete implementation plan is available at:
**`.claude/plans/breezy-gliding-nova.md`**

This document contains:
- Detailed architecture overview
- Phase-by-phase implementation guide
- Technical decisions and rationale
- Success criteria

## Code Organization

```
src/
├── extension.ts              # Entry point - registers providers and commands
├── constants/
│   └── directives.ts         # All 21 directive definitions with rules
├── models/
│   ├── directive.ts          # TypeScript interfaces for directives
│   └── store.ts              # TypeScript interfaces for stores
├── parsers/
│   ├── storeParser.ts        # Central store registry
│   ├── phpStoreParser.ts     # Parses wp_interactivity_state()
│   ├── jsStoreParser.ts      # Parses store() calls
│   └── contextParser.ts      # Parses inline data-wp-context
├── providers/
│   ├── directiveCompletionProvider.ts  # Directive autocomplete
│   └── valueCompletionProvider.ts      # Value autocomplete
├── utils/
│   ├── htmlParser.ts         # HTML/PHP parsing utilities
│   ├── documentParser.ts     # Document context detection
│   └── workspaceScanner.ts   # Directory-scoped file scanning
└── validators/
    └── duplicateValidator.ts # Duplicate directive detection
```

## Testing Locally

### Manual Testing

1. **Create test directory:**
   ```bash
   mkdir -p test-workspace
   cd test-workspace
   ```

2. **Create store definition (store.js):**
   ```javascript
   import { store } from '@wordpress/interactivity';

   store('myPlugin', {
       state: {
           counter: 0,
           isOpen: false
       },
       actions: {
           toggle: () => {}
       }
   });
   ```

3. **Create template (template.php):**
   ```php
   <div data-wp-interactive="myPlugin">
       <span data-wp-text="state."></span>
       <button data-wp-on--click="actions."></button>
   </div>
   ```

4. **Test autocomplete:**
   - Open template.php in Extension Development Host
   - Type `data-` to see directive suggestions
   - Type `state.` to see property suggestions

### What to Test

- [ ] Directive autocomplete in PHP files
- [ ] Directive autocomplete in HTML files
- [ ] Value suggestions for state properties
- [ ] Value suggestions for actions
- [ ] Duplicate directive warnings
- [ ] Inline context parsing
- [ ] Directory switching (stores update)
- [ ] Configuration toggle effects

## Making Changes

### Adding a New Directive

1. Edit `src/constants/directives.ts`
2. Add directive definition to the `DIRECTIVES` array
3. Recompile and test

### Modifying Parser Behavior

1. Edit the appropriate parser in `src/parsers/`
2. Update types in `src/models/` if needed
3. Add test cases (future)
4. Recompile and test

### Debugging

- Set breakpoints in TypeScript files
- Press `F5` to launch debugger
- Check Debug Console for logs
- Use `console.log()` for quick debugging

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit often
git add .
git commit -m "Brief description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

## Commit Message Guidelines

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation changes
- `test:` Test additions/changes
- `chore:` Build process, dependencies

Examples:
```
feat: add hover documentation for directives
fix: resolve duplicate detection for event handlers
refactor: optimize HTML parsing performance
docs: update README with new examples
```

## Publishing Checklist

Before publishing to VS Code Marketplace:

- [ ] All tests passing
- [ ] README.md has screenshots/GIFs
- [ ] CHANGELOG.md updated
- [ ] Version number bumped in package.json
- [ ] Production build tested (`npm run package`)
- [ ] .vsix file tested locally (`code --install-extension *.vsix`)
- [ ] Publisher account configured
- [ ] Icons and branding added

## Getting Help

- Review the [implementation plan](.claude/plans/breezy-gliding-nova.md)
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for common issues
- Review VSCode Extension API docs: https://code.visualstudio.com/api

## Resources

- [WordPress Interactivity API Docs](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
