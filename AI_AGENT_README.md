# AI Agent Onboarding Guide

## 🤖 Welcome AI Agent!

This file helps you quickly understand and continue work on this VSCode extension project.

## 📚 Essential Reading Order

1. **Start Here**: `PROJECT_CONTEXT.md` (5 min read)
   - Quick overview of what this project does
   - Current implementation status
   - Key concepts and architecture

2. **Implementation Details**: `.claude/plans/breezy-gliding-nova.md` (15 min read)
   - Complete phase-by-phase implementation plan
   - Technical decisions and rationale
   - Success criteria

3. **Code Structure**: `CONTRIBUTING.md` (10 min read)
   - File organization
   - Development workflow
   - Testing approach

4. **Tool-Specific**:
   - Cursor users: `.cursorrules`
   - GitHub Copilot users: `.github/copilot-instructions.md`

## 🎯 Quick Start Commands

```bash
# First time setup
npm install
npm run compile

# Development
npm run watch        # Auto-recompile on changes
code .              # Open in VSCode
# Then press F5      # Launch Extension Development Host

# Building
npm run compile     # Development build
npm run package     # Production build
```

## 🗺️ Project Map

### Most Important Files
```
src/
├── extension.ts                          # START HERE - Entry point
├── constants/directives.ts               # All 21 directives (source of truth)
├── models/
│   ├── directive.ts                      # Type definitions
│   └── store.ts                          # Store types
├── providers/
│   ├── directiveCompletionProvider.ts    # "data-" autocomplete
│   └── valueCompletionProvider.ts        # "state." autocomplete
└── parsers/
    ├── phpStoreParser.ts                 # Parse wp_interactivity_state()
    └── jsStoreParser.ts                  # Parse store() calls
```

### Configuration Files
```
.vscode/
├── launch.json      # Debug configuration (press F5)
├── tasks.json       # Build tasks
└── settings.json    # Workspace settings

Package files:
├── package.json     # Extension manifest + dependencies
├── tsconfig.json    # TypeScript configuration
└── webpack.config.js # Build configuration
```

## 🧠 Mental Model

### What This Extension Does
```
User opens PHP/HTML file
    ↓
Extension scans same directory for stores
    ↓
Parses PHP (wp_interactivity_state) and JS (store)
    ↓
Builds cache of available state/actions/callbacks
    ↓
User types "data-" → Shows directive suggestions
User types "state." → Shows property suggestions from cache
```

### Key Design Decisions
1. **Directory-scoped scanning** - Only scan active directory (not entire workspace)
2. **Pre-built completions** - Static directives built once in constructor
3. **Tolerant parsing** - Handles incomplete HTML/JSON during typing
4. **Warning-level diagnostics** - Duplicates show yellow squiggles (not red)

## 🔍 Common Tasks

### Adding a New Directive
1. Open `src/constants/directives.ts`
2. Add to `DIRECTIVES` array with full metadata
3. Test in Extension Development Host

### Fixing a Parser Bug
1. Identify which parser: PHP, JS, or Context
2. Add console.log to see what's being parsed
3. Fix the AST traversal logic
4. Test with problematic file

### Improving Completion Suggestions
1. Check the provider: `src/providers/directiveCompletionProvider.ts` or `valueCompletionProvider.ts`
2. Review context detection logic
3. Adjust filtering or suggestion generation
4. Test in Extension Development Host

### Adding Configuration
1. Add to `package.json` under `contributes.configuration`
2. Read config in relevant file: `vscode.workspace.getConfiguration('wpInteractivityAPI')`
3. Document in README.md

## 🐛 Debugging Tips

### Extension Won't Activate
- Check `package.json` activationEvents
- Must be 'php' or 'html' file
- Check Debug Console for errors

### Completions Not Showing
1. Verify language context: `DocumentParser.getLanguageContext()`
2. Check cursor position: `HtmlParser.isInAttributeName()`
3. Verify configuration is enabled
4. Not inside PHP tags

### Store Not Detected
1. Run command: "Show Available Stores"
2. Check Debug Console for parse errors
3. Verify file is in same directory
4. Check syntax is valid

### Duplicate Warnings Incorrect
1. Review rules in `src/constants/directives.ts`
2. Check `duplicateValidator.ts` logic
3. Verify HTML parser found correct element

## 📝 Code Style Guide

### TypeScript Patterns
```typescript
// ✅ Good
public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,  // Prefix unused with _
    _context: vscode.CompletionContext
): vscode.ProviderResult<vscode.CompletionItem[]> {
    // Check config first
    const config = vscode.workspace.getConfiguration('wpInteractivityAPI');
    if (!config.get<boolean>('enableFeature', true)) {
        return [];
    }
    // ... rest of logic
}

// ❌ Bad - Don't throw in providers
public provideCompletionItems(...) {
    throw new Error('Something went wrong'); // Never do this
}

// ✅ Good - Return empty array
public provideCompletionItems(...) {
    try {
        // logic
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}
```

### Naming Conventions
- Classes: PascalCase (`DirectiveCompletionProvider`)
- Files: camelCase (`directiveCompletionProvider.ts`)
- Interfaces: PascalCase (`DirectiveInfo`)
- Private fields: camelCase with `private` keyword
- Constants: UPPER_SNAKE_CASE or PascalCase for exports

## 🧪 Testing Checklist

Before submitting changes:
- [ ] Code compiles without errors (`npm run compile`)
- [ ] Extension loads in Development Host (F5)
- [ ] Autocomplete works for directives
- [ ] Autocomplete works for values
- [ ] Duplicate detection works
- [ ] Store detection works for PHP and JS
- [ ] Configuration toggles work
- [ ] No console errors in Debug Console

## 📊 Project Metrics

- **Implementation**: 100% complete (Phases 1-5)
- **Testing**: 10% complete (manual only)
- **Documentation**: 90% complete
- **Performance**: ✅ <100ms completions
- **Stability**: ⚠️ Needs more testing

## 🎯 Current Priorities

1. **Testing** - Add unit and integration tests
2. **Edge Cases** - Handle malformed stores better
3. **Performance** - Benchmark with large projects
4. **Documentation** - Add more examples
5. **Publishing** - Prepare for VS Code Marketplace

## 🔗 Quick Links

- WordPress Interactivity API Docs: https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/
- VSCode Extension API: https://code.visualstudio.com/api
- Implementation Plan: `.claude/plans/breezy-gliding-nova.md`
- Issue Tracker: GitHub Issues (if repository is public)

## 💡 Tips for AI Agents

### When Uncertain
1. Read the implementation plan first
2. Look for similar existing code
3. Check type definitions in `models/`
4. Test in Extension Development Host

### When Suggesting Changes
1. Explain the "why" not just the "what"
2. Reference existing patterns
3. Consider performance impact
4. Update documentation if needed

### When Debugging
1. Use `console.log()` - appears in Debug Console
2. Set breakpoints in TypeScript (not compiled JS)
3. Test with minimal reproduction case
4. Check all three contexts: directives, values, duplicates

## 🚀 Advanced Topics

### Custom Directives
To add support for custom directives:
1. User could configure via settings
2. Load from workspace `.wp-directives.json`
3. Merge with built-in directives
4. Update completion provider

### Cross-Directory Stores
Currently limited to same directory. To support:
1. Add workspace-level scanning
2. Implement store namespacing by directory
3. Update registry to handle conflicts
4. Performance testing required

### Type Inference
Currently basic. Could enhance:
1. Parse TypeScript type annotations
2. Infer from usage patterns
3. Use JSDoc comments
4. Provide type checking

## 📞 Getting Help

If you encounter issues:
1. Check Debug Console for errors
2. Review relevant file in `src/`
3. Consult implementation plan
4. Test with minimal example
5. Document issue with reproduction steps

---

**Remember**: This extension is production-ready for the core features. The focus should be on testing, edge cases, and polish rather than adding new features.

**Good luck!** 🎉
