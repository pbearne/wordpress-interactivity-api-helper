import * as vscode from 'vscode';
import { DIRECTIVES, getDirectiveDefinition } from '../constants/directives';
import { HtmlParser } from '../utils/htmlParser';
import { DocumentParser } from '../utils/documentParser';

/**
 * Completion provider for WordPress Interactivity API directives
 */
export class DirectiveCompletionProvider implements vscode.CompletionItemProvider {
	private completionItems: vscode.CompletionItem[] = [];

	constructor() {
		// Pre-build completion items for better performance
		this.buildCompletionItems();
	}

	/**
	 * Build completion items from directive definitions
	 */
	private buildCompletionItems(): void {
		this.completionItems = DIRECTIVES.map(directive => {
			const item = new vscode.CompletionItem(
				directive.displayName || directive.name,
				vscode.CompletionItemKind.Property
			);

			item.detail = `[WordPress Interactivity API] ${directive.category}`;
			item.documentation = new vscode.MarkdownString(directive.documentation);

			// Use snippet if available
			if (directive.snippet) {
				item.insertText = new vscode.SnippetString(directive.snippet);
			} else {
				item.insertText = directive.name;
			}

			// Sort order: core directives first, then others
			item.sortText = directive.category === 'core' ? `0${directive.name}` : `1${directive.name}`;

			return item;
		});
	}

	/**
	 * Provide completion items
	 */
	public provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		// Check if completions are enabled
		const config = vscode.workspace.getConfiguration('wpInteractivityAPI');
		if (!config.get<boolean>('enableDirectiveCompletion', true)) {
			return [];
		}

		// Check if we're in HTML context (not inside PHP tags)
		const langContext = DocumentParser.getLanguageContext(document, position);
		if (langContext === 'php') {
			return [];
		}

		// Check if we're in an attribute name position
		if (!HtmlParser.isInAttributeName(document, position)) {
			return [];
		}

		// Get existing directives on the current element
		const element = HtmlParser.findElementAtPosition(document, position);
		const existingDirectives = element
			? HtmlParser.extractDirectives(element, document)
			: [];

		// Filter completion items based on existing directives
		const filteredItems = this.filterByExistingDirectives(
			this.completionItems,
			existingDirectives.map(d => d.name)
		);

		return filteredItems;
	}

	/**
	 * Filter completion items based on existing directives on the element
	 */
	private filterByExistingDirectives(
		items: vscode.CompletionItem[],
		existingDirectives: string[]
	): vscode.CompletionItem[] {
		// If no existing directives, return all items
		if (existingDirectives.length === 0) {
			return items;
		}

		return items.filter(item => {
			const directiveName = typeof item.insertText === 'string'
				? item.insertText
				: item.label.toString();

			// Get the base directive name (without suffix placeholder)
			const baseName = directiveName.split('--')[0];

			// Check if this directive already exists
			const definition = getDirectiveDefinition(baseName);
			if (!definition) {
				return true;
			}

			// If directive doesn't allow duplicates, check if it exists
			if (!definition.allowDuplicates && !definition.allowMultipleWithUniqueId) {
				const exists = existingDirectives.some(existing =>
					existing.startsWith(baseName)
				);
				if (exists) {
					return false;
				}
			}

			// For directives that require unique suffix (bind, class, style)
			// we allow them but user needs to specify different suffixes
			if (definition.requiresUniqueSuffix) {
				// Always allow these, as they need different suffixes
				return true;
			}

			return true;
		});
	}

	/**
	 * Provide additional information when hovering over a completion item
	 */
	public resolveCompletionItem(
		item: vscode.CompletionItem,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CompletionItem> {
		// Additional details are already set, but we can enhance here if needed
		return item;
	}
}
