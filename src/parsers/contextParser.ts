import { PropertyInfo } from '../models/store';

/**
 * Parser for inline data-wp-context attributes
 */
export class ContextParser {
	/**
	 * Parse context properties from a data-wp-context attribute value
	 */
	public parseContextValue(value: string): Map<string, PropertyInfo> {
		const properties = new Map<string, PropertyInfo>();

		try {
			// Handle both single and double quotes
			// Also handle incomplete JSON during typing
			let jsonValue = value.trim();

			// If the value starts with a quote, try to remove it
			if (jsonValue.startsWith("'") || jsonValue.startsWith('"')) {
				jsonValue = jsonValue.substring(1);
			}

			// If the value ends with a quote, try to remove it
			if (jsonValue.endsWith("'") || jsonValue.endsWith('"')) {
				jsonValue = jsonValue.substring(0, jsonValue.length - 1);
			}

			// Try to parse as JSON
			// Use a tolerant approach for incomplete JSON
			const parsed = this.tolerantJsonParse(jsonValue);
			if (parsed) {
				this.extractProperties(parsed, properties);
			}
		} catch (error) {
			// If parsing fails, try to extract property names manually
			this.extractPropertyNamesManually(value, properties);
		}

		return properties;
	}

	/**
	 * Tolerant JSON parsing that handles incomplete JSON
	 */
	private tolerantJsonParse(value: string): any {
		try {
			// Try direct parse first
			return JSON.parse(value);
		} catch (error) {
			// Try to fix common issues with single-pass counting
			let fixed = value;

			// Count all bracket types in one pass
			const brackets = fixed.match(/[{}\[\]]/g) || [];
			let openBraces = 0;
			let closeBraces = 0;
			let openBrackets = 0;
			let closeBrackets = 0;

			for (const char of brackets) {
				if (char === '{') {
					openBraces++;
				} else if (char === '}') {
					closeBraces++;
				} else if (char === '[') {
					openBrackets++;
				} else if (char === ']') {
					closeBrackets++;
				}
			}

			// Add missing closing brackets
			if (openBraces > closeBraces) {
				fixed += '}'.repeat(openBraces - closeBraces);
			}
			if (openBrackets > closeBrackets) {
				fixed += ']'.repeat(openBrackets - closeBrackets);
			}

			// Try again
			try {
				return JSON.parse(fixed);
			} catch {
				return null;
			}
		}
	}

	/**
	 * Extract properties from parsed JSON object
	 */
	private extractProperties(
		obj: any,
		properties: Map<string, PropertyInfo>,
		prefix: string = ''
	): void {
		if (typeof obj !== 'object' || obj === null) {
			return;
		}

		for (const key in obj) {
			if (!obj.hasOwnProperty(key)) {
				continue;
			}

			const fullKey = prefix ? `${prefix}.${key}` : key;
			const value = obj[key];

			const propertyInfo: PropertyInfo = {
				name: fullKey,
				type: this.inferType(value)
			};

			// Check if value is an object
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				propertyInfo.isObject = true;
				propertyInfo.properties = new Map();
				this.extractProperties(value, propertyInfo.properties, fullKey);
			}

			properties.set(key, propertyInfo);
		}
	}

	/**
	 * Extract property names manually from incomplete JSON
	 */
	private extractPropertyNamesManually(
		value: string,
		properties: Map<string, PropertyInfo>
	): void {
		// Match property names in JSON format: "propertyName":
		const propertyRegex = /["'](\w+)["']\s*:/g;
		let match;

		while ((match = propertyRegex.exec(value)) !== null) {
			const propertyName = match[1];
			properties.set(propertyName, {
				name: propertyName,
				type: 'unknown'
			});
		}
	}

	/**
	 * Infer type from a JavaScript value
	 */
	private inferType(value: any): string {
		if (value === null) {
			return 'null';
		}
		if (Array.isArray(value)) {
			return 'array';
		}
		return typeof value;
	}

	/**
	 * Parse all context attributes from a document
	 */
	public parseDocumentContexts(content: string): Map<string, PropertyInfo>[] {
		const contexts: Map<string, PropertyInfo>[] = [];

		// Find all data-wp-context attributes
		const contextRegex = /data-wp-context\s*=\s*(['"])([^'"]*)\1/g;
		let match;

		while ((match = contextRegex.exec(content)) !== null) {
			const contextValue = match[2];
			const properties = this.parseContextValue(contextValue);
			if (properties.size > 0) {
				contexts.push(properties);
			}
		}

		return contexts;
	}
}
