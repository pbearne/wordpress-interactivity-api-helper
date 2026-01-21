# GitHub Copilot Instructions for WordPress Interactivity API Helper

## Project Context
VSCode extension for WordPress Interactivity API autocomplete in PHP and HTML files.

## Key Principles
1. **Performance First**: Completion suggestions must be instant (<100ms)
2. **Directory-Scoped**: Only scan files in active directory
3. **Tolerant Parsing**: Handle incomplete HTML/JSON during typing
4. **Type Safety**: Leverage TypeScript strict mode
5. **VSCode Patterns**: Follow official extension API patterns

## Code Generation Guidelines

### When Suggesting Completion Logic
- Always check configuration first: `vscode.workspace.getConfiguration('wpInteractivityAPI')`
- Filter by language context: PHP vs HTML via `DocumentParser.getLanguageContext()`
- Check cursor position: attribute name vs attribute value
- Return empty array if context is invalid

### When Parsing Stores
- **PHP**: Look for `wp_interactivity_state('namespace', array(...))`
- **JavaScript**: Look for `store('namespace', { state, actions, callbacks })`
- Handle parse errors gracefully (return empty array)
- Extract property names and types when possible

### When Working with Directives
- Reference `DIRECTIVES` array from `src/constants/directives.ts`
- Check duplication rules via `getDirectiveDefinition()`
- Use `DirectiveCategory` enum for categorization
- Include documentation in completion items

### Naming Conventions
- Providers: `*CompletionProvider`
- Parsers: `*StoreParser` or `*Parser`
- Validators: `*Validator`
- Utils: Descriptive names (`htmlParser`, `documentParser`)
- Interfaces: PascalCase with descriptive names

### Error Handling
```typescript
try {
    // Parse operation
} catch (error) {
    // Log to console (shows in Debug Console)
    console.error('Error parsing file:', error);
    // Return safe default
    return [];
}
```

### Testing Suggestions
```typescript
// Example test structure
describe('PhpStoreParser', () => {
    it('should parse wp_interactivity_state calls', () => {
        const content = `<?php wp_interactivity_state('myPlugin', array('counter' => 0)); ?>`;
        const stores = parser.parseFile(content, 'test.php');
        expect(stores).toHaveLength(1);
        expect(stores[0].namespace).toBe('myPlugin');
    });
});
```

## Common Patterns

### Completion Provider Template
```typescript
public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
): vscode.ProviderResult<vscode.CompletionItem[]> {
    // 1. Check config
    const config = vscode.workspace.getConfiguration('wpInteractivityAPI');
    if (!config.get<boolean>('enableFeature', true)) {
        return [];
    }

    // 2. Validate context
    const langContext = DocumentParser.getLanguageContext(document, position);
    if (langContext === 'php') {
        return [];
    }

    // 3. Check position
    if (!HtmlParser.isInAttributeName(document, position)) {
        return [];
    }

    // 4. Generate completions
    return this.generateCompletions();
}
```

### Store Parser Template
```typescript
public parseFile(content: string, filePath: string): StoreDefinition[] {
    try {
        const ast = this.parser.parseCode(content);
        return this.extractStores(ast, filePath);
    } catch (error) {
        console.error('Error parsing file:', error);
        return [];
    }
}
```

### Registry Pattern
```typescript
// Add with merge capability
public mergeStore(newStore: StoreDefinition): void {
    const existing = this.stores.get(newStore.namespace);
    if (!existing) {
        this.addStore(newStore);
        return;
    }
    // Merge properties...
}
```

## File-Specific Guidance

### `src/extension.ts`
- Register providers for both 'php' and 'html' languages
- Set up file watchers for active directory
- Register commands with unique IDs
- Clean up resources on deactivate

### `src/constants/directives.ts`
- Each directive needs: name, category, allowDuplicates, documentation, snippet
- Maintain alphabetical order within categories
- Include both `name` and `displayName` for suffix-based directives

### `src/parsers/*.ts`
- Always return arrays (never null/undefined)
- Use AST parsing, not regex
- Extract as much type information as possible
- Handle both modern and legacy syntax

### `src/providers/*.ts`
- Pre-build static completions in constructor
- Check configuration first
- Validate context before generating suggestions
- Use `CompletionItemKind` appropriately (Property, Method, Function, etc.)

## WordPress Interactivity API Reference

### Directive Categories
1. **Core**: Interactive block setup
2. **Attributes**: Dynamic HTML attributes
3. **Events**: User interaction handling
4. **Side Effects**: Reactive behaviors
5. **Lists**: Array rendering

### Value Reference Patterns
- `state.propertyName` - Global state
- `context.propertyName` - Local context
- `actions.methodName` - Action methods
- `callbacks.methodName` - Callback methods
- `namespace::state.property` - Cross-namespace

## Anti-Patterns to Avoid
❌ Don't scan entire workspace (directory-scoped only)
❌ Don't use regex for parsing PHP/JS (use AST)
❌ Don't block the UI thread (async operations)
❌ Don't ignore configuration settings
❌ Don't throw unhandled exceptions in providers
❌ Don't create completion items on every call (pre-build when possible)

## Debugging Tips
- Use `console.log()` - appears in Debug Console
- Set breakpoints in TypeScript files
- Launch with F5 - opens Extension Development Host
- Check "Output" > "Extension Host" for errors

## Documentation Standards
```typescript
/**
 * Brief description of what this does
 *
 * @param document - The text document
 * @param position - Cursor position
 * @returns Array of completion items or empty array
 */
```

## When Adding New Directives
1. Add to `DIRECTIVES` array in constants
2. Specify duplication rules
3. Add documentation (from WordPress docs)
4. Create snippet with placeholders
5. Test in Extension Development Host

## Performance Checklist
- [ ] No synchronous file system operations in providers
- [ ] Use debouncing for file watcher callbacks
- [ ] Cache parsed results with content hash
- [ ] Pre-build static completions
- [ ] Limit parsing scope to relevant regions
