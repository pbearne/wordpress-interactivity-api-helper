import * as vscode from 'vscode';
import { parse, HTMLElement } from 'node-html-parser';
import { DirectiveInfo } from '../models/directive';

/**
 * Cache entry for parsed HTML documents
 */
interface ParseCacheEntry {
	version: number;
	root: HTMLElement;
	timestamp: number;
}

/**
 * Simple LRU cache implementation
 */
class LRUCache<K, V> {
	private cache = new Map<K, V>();
	private maxSize: number;

	constructor(maxSize: number = 20) {
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		const value = this.cache.get(key);
		if (value) {
			// Move to end (most recently used)
			this.cache.delete(key);
			this.cache.set(key, value);
		}
		return value;
	}

	set(key: K, value: V): void {
		// Remove if exists (to update position)
		this.cache.delete(key);

		// Add to end
		this.cache.set(key, value);

		// Remove oldest if over capacity
		if (this.cache.size > this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey !== undefined) {
				this.cache.delete(firstKey);
			}
		}
	}

	clear(): void {
		this.cache.clear();
	}
}

/**
 * Utility class for parsing HTML in PHP and HTML files
 */
export class HtmlParser {
	private static parseCache = new LRUCache<string, ParseCacheEntry>(20);
	private static readonly CACHE_TTL = 5000; // 5 seconds
	/**
	 * Find the HTML element at the given position in the document
	 */
	public static findElementAtPosition(
		document: vscode.TextDocument,
		position: vscode.Position
	): HTMLElement | null {
		try {
			// Check cache first
			const cacheKey = document.uri.toString();
			const cached = this.parseCache.get(cacheKey);
			const now = Date.now();

			let root: HTMLElement;

			if (cached &&
				cached.version === document.version &&
				(now - cached.timestamp) < this.CACHE_TTL) {
				// Use cached parse result
				root = cached.root;
			} else {
				// Parse and cache
				const text = document.getText();
				root = parse(text, {
					lowerCaseTagName: false,
					comment: false,
					blockTextElements: {
						script: false,
						noscript: false,
						style: false,
						pre: false
					}
				});

				// Store in cache
				this.parseCache.set(cacheKey, {
					version: document.version,
					root: root,
					timestamp: now
				});
			}

			// Find element containing the cursor position
			const offset = document.offsetAt(position);
			return this.findElementByOffset(root, offset, document.getText());
		} catch (error) {
			// If parsing fails, return null
			return null;
		}
	}

	/**
	 * Clear the parse cache (useful for testing or on dispose)
	 */
	public static clearCache(): void {
		this.parseCache.clear();
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
		// Get text from start of document to cursor (to handle multiline tags)
		const textBeforeCursor = document.getText(
			new vscode.Range(new vscode.Position(0, 0), position)
		);

		// Find the last opening and closing tag brackets
		const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
		const lastCloseBracket = textBeforeCursor.lastIndexOf('>');

		// Must be inside a tag (after < and before >)
		if (lastOpenBracket === -1 || lastCloseBracket > lastOpenBracket) {
			return false;
		}

		// Get the text within the current tag
		const tagContent = textBeforeCursor.substring(lastOpenBracket);

		// Check if we're not inside quotes (count quotes to see if we're between a pair)
		const doubleQuotes = (tagContent.match(/"/g) || []).length;
		const singleQuotes = (tagContent.match(/'/g) || []).length;

		// If odd number of quotes, we're inside a quoted value
		if (doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0) {
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
		// Get text from start of document to cursor (to handle multiline tags)
		const textBeforeCursor = document.getText(
			new vscode.Range(new vscode.Position(0, 0), position)
		);

		// Find the last opening and closing tag brackets
		const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
		const lastCloseBracket = textBeforeCursor.lastIndexOf('>');

		// Must be inside a tag (after < and before >)
		if (lastOpenBracket === -1 || lastCloseBracket > lastOpenBracket) {
			return false;
		}

		// Get the text within the current tag
		const tagContent = textBeforeCursor.substring(lastOpenBracket);

		// Check if we're inside quotes (odd number of quotes means we're inside)
		const doubleQuotes = (tagContent.match(/"/g) || []).length;
		const singleQuotes = (tagContent.match(/'/g) || []).length;

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
		// Get text from start of document to cursor (to handle multiline attributes)
		const textBeforeCursor = document.getText(
			new vscode.Range(new vscode.Position(0, 0), position)
		);

		// Find the last opening tag bracket
		const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
		if (lastOpenBracket === -1) {
			return null;
		}

		// Get the text within the current tag
		const tagContent = textBeforeCursor.substring(lastOpenBracket);

		// Look for the attribute name before the cursor
		// Match: attribute-name="value or attribute-name='value
		const attrMatch = tagContent.match(/(\S+?)\s*=\s*["'][^"']*$/);
		if (attrMatch) {
			return attrMatch[1];
		}

		return null;
	}

	/**
	 * Find the nearest data-wp-context attribute by walking up the element tree
	 */
	public static findNearestContextAttribute(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		console.log('[WP Interactivity API] Finding nearest context attribute...');

		// Try the DOM-based approach first
		const element = this.findElementAtPosition(document, position);
		console.log('[WP Interactivity API] findElementAtPosition returned:', element ? element.tagName : 'null');

		if (element) {
			// Check current element and ancestors for data-wp-context
			let current: HTMLElement | null = element;
			let depth = 0;
			while (current) {
				console.log(`[WP Interactivity API] Checking element at depth ${depth}:`, current.tagName);
				const attributes = this.extractAttributes(current);
				console.log('[WP Interactivity API] Attributes:', Array.from(attributes.keys()));

				if (attributes.has('data-wp-context')) {
					const contextValue = attributes.get('data-wp-context')!;
					console.log('[WP Interactivity API] Found data-wp-context via DOM:', contextValue);
					return contextValue;
				}
				// Move to parent
				current = current.parentNode as HTMLElement;
				depth++;
			}
			console.log('[WP Interactivity API] No data-wp-context found via DOM after checking', depth, 'elements');
		}

		// Fallback: Search backwards through text for data-wp-context
		console.log('[WP Interactivity API] Trying text-based search...');
		const textBefore = document.getText(
			new vscode.Range(new vscode.Position(0, 0), position)
		);
		console.log('[WP Interactivity API] Text length before cursor:', textBefore.length);

		// Find all opening tags with data-wp-context before the cursor
		// Match: <tag ... data-wp-context='...' ...> or <tag ... data-wp-context="..." ...>
		// Need to handle nested quotes in JSON, so we can't use [^'"]
		// Instead, match everything until we find the closing quote that matches the opening one
		const contextRegex = /data-wp-context\s*=\s*'([^']*)'|data-wp-context\s*=\s*"([^"]*)"/g;
		let match;
		let lastContext: string | null = null;
		let lastContextPos = -1;
		let matchCount = 0;

		while ((match = contextRegex.exec(textBefore)) !== null) {
			matchCount++;
			// Group 1 is for single quotes, Group 2 is for double quotes
			lastContext = match[1] || match[2];
			lastContextPos = match.index;
			console.log('[WP Interactivity API] Found context match #', matchCount, ':', lastContext);
		}

		console.log('[WP Interactivity API] Total context matches found:', matchCount);

		if (lastContext && lastContextPos !== -1) {
			console.log('[WP Interactivity API] Last context value:', lastContext);
			console.log('[WP Interactivity API] Last context position:', lastContextPos);

			// Find the tag name of the element with data-wp-context
			// Need to search backwards to find the opening tag
			const textBeforeContext = textBefore.substring(0, lastContextPos);
			const lastOpenTag = textBeforeContext.lastIndexOf('<');

			if (lastOpenTag !== -1) {
				const tagText = textBefore.substring(lastOpenTag, lastContextPos + 100);
				console.log('[WP Interactivity API] Tag text:', tagText);

				const tagMatch = tagText.match(/<(\w+)/);

				if (tagMatch) {
					const tagName = tagMatch[1];
					console.log('[WP Interactivity API] Tag name:', tagName);

					// Check if we've encountered a closing tag for this element
					const closingTagRegex = new RegExp(`</${tagName}>`, 'g');
					const textAfterTag = textBefore.substring(lastContextPos);

					// Count opening and closing tags
					const openings = (textAfterTag.match(new RegExp(`<${tagName}[^/>]*>`, 'g')) || []).length;
					const closings = (textAfterTag.match(closingTagRegex) || []).length;

					console.log('[WP Interactivity API] After this tag - openings:', openings, 'closings:', closings);

					// If closings >= openings + 1, we've left the element
					if (closings < openings + 1) {
						console.log('[WP Interactivity API] Found data-wp-context via text search:', lastContext);
						return lastContext;
					} else {
						console.log('[WP Interactivity API] Already outside the element (closings >= openings + 1)');
					}
				} else {
					console.log('[WP Interactivity API] Could not match tag name');
				}
			} else {
				console.log('[WP Interactivity API] Could not find opening tag');
			}
		} else {
			console.log('[WP Interactivity API] No context matches found or invalid position');
		}

		console.log('[WP Interactivity API] No data-wp-context found');
		return null;
	}
}
