import * as vscode from 'vscode';
import { parse, HTMLElement } from 'node-html-parser';
import { DirectiveInfo } from '../models/directive';

/**
 * Utility class for parsing HTML in PHP and HTML files
 */
export class HtmlParser {
	/**
	 * Find the HTML element at the given position in the document
	 */
	public static findElementAtPosition(
		document: vscode.TextDocument,
		position: vscode.Position
	): HTMLElement | null {
		try {
			// Get the text content around the position
			const text = document.getText();

			// Parse HTML with tolerant mode
			const root = parse(text, {
				lowerCaseTagName: false,
				comment: false,
				blockTextElements: {
					script: false,
					noscript: false,
					style: false,
					pre: false
				}
			});

			// Find element containing the cursor position
			const offset = document.offsetAt(position);
			return this.findElementByOffset(root, offset, text);
		} catch (error) {
			// If parsing fails, return null
			return null;
		}
	}

	/**
	 * Find element by character offset
	 */
	private static findElementByOffset(
		element: HTMLElement,
		offset: number,
		fullText: string
	): HTMLElement | null {
		// Check if this element contains the offset
		const elementText = element.toString();
		const elementStart = fullText.indexOf(elementText);

		if (elementStart === -1) {
			return null;
		}

		const elementEnd = elementStart + elementText.length;

		// If offset is within this element's opening tag
		const openTagEnd = elementText.indexOf('>');
		if (openTagEnd !== -1 && offset >= elementStart && offset <= elementStart + openTagEnd) {
			return element;
		}

		// Check children
		for (const child of element.childNodes) {
			if (child instanceof HTMLElement) {
				const result = this.findElementByOffset(child, offset, fullText);
				if (result) {
					return result;
				}
			}
		}

		// If no child contains it and offset is within element bounds, return this element
		if (offset >= elementStart && offset <= elementEnd) {
			return element;
		}

		return null;
	}

	/**
	 * Extract all attributes from an element
	 */
	public static extractAttributes(element: HTMLElement): Map<string, string> {
		const attributes = new Map<string, string>();

		if (!element.rawAttrs) {
			return attributes;
		}

		// Parse attributes manually since node-html-parser may not handle all edge cases
		const attrRegex = /(\S+?)=["']([^"']*?)["']/g;
		let match;

		while ((match = attrRegex.exec(element.rawAttrs)) !== null) {
			attributes.set(match[1], match[2]);
		}

		return attributes;
	}

	/**
	 * Extract all directives from an element
	 */
	public static extractDirectives(
		element: HTMLElement,
		document: vscode.TextDocument
	): DirectiveInfo[] {
		const directives: DirectiveInfo[] = [];
		const attributes = this.extractAttributes(element);

		for (const [name, value] of attributes.entries()) {
			if (name.startsWith('data-wp-')) {
				const baseName = name.split('--')[0];
				const suffix = name.includes('--') ? name.split('--').slice(1).join('--') : undefined;

				// Try to find the range of this attribute in the document
				const range = this.findAttributeRange(document, element, name);

				directives.push({
					name,
					baseName,
					suffix,
					value,
					range: range || new vscode.Range(0, 0, 0, 0)
				});
			}
		}

		return directives;
	}

	/**
	 * Find the range of an attribute in the document
	 */
	private static findAttributeRange(
		document: vscode.TextDocument,
		element: HTMLElement,
		attributeName: string
	): vscode.Range | null {
		try {
			const text = document.getText();
			const elementText = element.toString();
			const elementStart = text.indexOf(elementText);

			if (elementStart === -1) {
				return null;
			}

			// Find the attribute within the opening tag
			const openTag = elementText.substring(0, elementText.indexOf('>') + 1);
			const attrRegex = new RegExp(`\\b${attributeName}\\s*=\\s*["'][^"']*["']`, 'g');
			const match = attrRegex.exec(openTag);

			if (match) {
				const attrStart = elementStart + match.index;
				const attrEnd = attrStart + match[0].length;

				return new vscode.Range(
					document.positionAt(attrStart),
					document.positionAt(attrEnd)
				);
			}
		} catch (error) {
			// Return null if range cannot be determined
		}

		return null;
	}

	/**
	 * Check if cursor is in an attribute name position
	 */
	public static isInAttributeName(
		document: vscode.TextDocument,
		position: vscode.Position
	): boolean {
		const line = document.lineAt(position.line);
		const textBeforeCursor = line.text.substring(0, position.character);

		// Check if we're inside an HTML tag
		const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
		const lastCloseBracket = textBeforeCursor.lastIndexOf('>');

		if (lastOpenBracket === -1 || lastCloseBracket > lastOpenBracket) {
			return false;
		}

		// Check if we're not inside quotes
		const quotes = textBeforeCursor.match(/["']/g);
		if (quotes && quotes.length % 2 !== 0) {
			return false;
		}

		return true;
	}

	/**
	 * Check if cursor is in an attribute value position
	 */
	public static isInAttributeValue(
		document: vscode.TextDocument,
		position: vscode.Position
	): boolean {
		const line = document.lineAt(position.line);
		const textBeforeCursor = line.text.substring(0, position.character);

		// Check if we're inside an HTML tag
		const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
		const lastCloseBracket = textBeforeCursor.lastIndexOf('>');

		if (lastOpenBracket === -1 || lastCloseBracket > lastOpenBracket) {
			return false;
		}

		// Check if we're inside quotes (odd number of quotes means we're inside)
		const doubleQuotes = (textBeforeCursor.match(/"/g) || []).length;
		const singleQuotes = (textBeforeCursor.match(/'/g) || []).length;

		// We're in a value if we have an odd number of quotes
		return (doubleQuotes % 2 !== 0) || (singleQuotes % 2 !== 0);
	}

	/**
	 * Get the attribute name at the cursor position (if in attribute value)
	 */
	public static getAttributeNameAtPosition(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		const line = document.lineAt(position.line);
		const textBeforeCursor = line.text.substring(0, position.character);

		// Look for the attribute name before the cursor
		const attrMatch = textBeforeCursor.match(/(\S+?)\s*=\s*["'][^"']*$/);
		if (attrMatch) {
			return attrMatch[1];
		}

		return null;
	}
}
