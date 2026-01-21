import * as vscode from 'vscode';

/**
 * Language context of the cursor position
 */
export type LanguageContext = 'html' | 'php' | 'unknown';

/**
 * Utility class for document-level parsing operations
 */
export class DocumentParser {
	/**
	 * Determine the language context at the given position
	 * (whether we're in HTML or PHP code)
	 */
	public static getLanguageContext(
		document: vscode.TextDocument,
		position: vscode.Position
	): LanguageContext {
		// For HTML files, always return html
		if (document.languageId === 'html') {
			return 'html';
		}

		// For PHP files, check if we're inside PHP tags
		if (document.languageId === 'php') {
			const textBeforePosition = document.getText(
				new vscode.Range(new vscode.Position(0, 0), position)
			);

			// Count PHP opening and closing tags
			const openTags = (textBeforePosition.match(/<\?php/g) || []).length;
			const closeTags = (textBeforePosition.match(/\?>/g) || []).length;

			// If we have more open tags than close tags, we're in PHP context
			if (openTags > closeTags) {
				return 'php';
			}

			return 'html';
		}

		return 'unknown';
	}

	/**
	 * Check if the position is inside PHP tags
	 */
	public static isInPhpTag(
		document: vscode.TextDocument,
		position: vscode.Position
	): boolean {
		return this.getLanguageContext(document, position) === 'php';
	}

	/**
	 * Extract text region from document
	 */
	public static extractTextRegion(
		document: vscode.TextDocument,
		start: vscode.Position,
		end: vscode.Position
	): string {
		return document.getText(new vscode.Range(start, end));
	}

	/**
	 * Get text around position with specified line context
	 */
	public static getTextAroundPosition(
		document: vscode.TextDocument,
		position: vscode.Position,
		linesBefore: number = 5,
		linesAfter: number = 5
	): string {
		const startLine = Math.max(0, position.line - linesBefore);
		const endLine = Math.min(document.lineCount - 1, position.line + linesAfter);

		const start = new vscode.Position(startLine, 0);
		const end = new vscode.Position(endLine, document.lineAt(endLine).text.length);

		return document.getText(new vscode.Range(start, end));
	}

	/**
	 * Find the nearest data-wp-interactive directive before the cursor
	 */
	public static findNearestNamespace(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		// Search backwards from current position
		const textBefore = document.getText(
			new vscode.Range(new vscode.Position(0, 0), position)
		);

		// Look for data-wp-interactive attribute
		const interactiveRegex = /data-wp-interactive\s*=\s*["']([^"']+)["']/g;
		let match;
		let lastNamespace: string | null = null;

		while ((match = interactiveRegex.exec(textBefore)) !== null) {
			lastNamespace = match[1];
		}

		return lastNamespace;
	}

	/**
	 * Parse value prefix to determine what type of completion to provide
	 * Returns: state, context, actions, callbacks, or null
	 */
	public static parseValuePrefix(value: string): {
		type: 'state' | 'context' | 'actions' | 'callbacks' | 'namespace' | null;
		prefix: string;
		namespace?: string;
	} {
		// Check for cross-namespace reference (e.g., "otherPlugin::state.prop")
		const namespaceMatch = value.match(/^(\w+)::(state|context|actions|callbacks)\.?(.*)$/);
		if (namespaceMatch) {
			return {
				type: namespaceMatch[2] as 'state' | 'context' | 'actions' | 'callbacks',
				prefix: namespaceMatch[3],
				namespace: namespaceMatch[1]
			};
		}

		// Check for direct references
		if (value.startsWith('state.')) {
			return { type: 'state', prefix: value.substring(6) };
		}
		if (value.startsWith('context.')) {
			return { type: 'context', prefix: value.substring(8) };
		}
		if (value.startsWith('actions.')) {
			return { type: 'actions', prefix: value.substring(8) };
		}
		if (value.startsWith('callbacks.')) {
			return { type: 'callbacks', prefix: value.substring(10) };
		}

		// Check if we're starting to type a reference
		if (value === 'state' || value === 'context' || value === 'actions' || value === 'callbacks') {
			return { type: null, prefix: value };
		}

		return { type: null, prefix: value };
	}

	/**
	 * Get the current attribute value being edited
	 */
	public static getCurrentAttributeValue(
		document: vscode.TextDocument,
		position: vscode.Position
	): string {
		const line = document.lineAt(position.line);
		const textBeforeCursor = line.text.substring(0, position.character);

		// Find the opening quote of the current attribute value
		let quoteChar: string | null = null;
		let quotePos = -1;

		// Check for double quote
		const lastDoubleQuote = textBeforeCursor.lastIndexOf('"');
		// Check for single quote
		const lastSingleQuote = textBeforeCursor.lastIndexOf("'");

		if (lastDoubleQuote > lastSingleQuote) {
			quoteChar = '"';
			quotePos = lastDoubleQuote;
		} else if (lastSingleQuote > lastDoubleQuote) {
			quoteChar = "'";
			quotePos = lastSingleQuote;
		}

		if (quoteChar === null || quotePos === -1) {
			return '';
		}

		// Extract text from quote to cursor
		return textBeforeCursor.substring(quotePos + 1);
	}
}
