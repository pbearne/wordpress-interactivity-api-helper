import { Engine } from 'php-parser';
import { StoreDefinition, PropertyInfo } from '../models/store';

/**
 * Parser for PHP files containing wp_interactivity_state() calls
 */
export class PhpStoreParser {
	private parser: Engine;

	constructor() {
		this.parser = new Engine({
			parser: {
				extractDoc: true,
				suppressErrors: true
			},
			ast: {
				withPositions: true
			}
		});
	}

	/**
	 * Parse a PHP file and extract store definitions
	 */
	public parseFile(content: string, filePath: string): StoreDefinition[] {
		try {
			const ast = this.parser.parseCode(content, filePath);
			return this.extractStores(ast, filePath);
		} catch (error) {
			// If parsing fails, return empty array
			console.error('Error parsing PHP file:', error);
			return [];
		}
	}

	/**
	 * Extract store definitions from PHP AST
	 */
	private extractStores(ast: any, filePath: string): StoreDefinition[] {
		const stores: StoreDefinition[] = [];

		// Traverse AST to find wp_interactivity_state calls
		this.traverse(ast, (node: any) => {
			if (this.isInteractivityStateCall(node)) {
				const store = this.parseStoreFromCall(node, filePath);
				if (store) {
					stores.push(store);
				}
			}
		});

		return stores;
	}

	/**
	 * Check if a node is a wp_interactivity_state function call
	 */
	private isInteractivityStateCall(node: any): boolean {
		return (
			node &&
			node.kind === 'call' &&
			node.what &&
			node.what.kind === 'name' &&
			node.what.name === 'wp_interactivity_state'
		);
	}

	/**
	 * Parse store definition from a wp_interactivity_state call
	 */
	private parseStoreFromCall(node: any, filePath: string): StoreDefinition | null {
		if (!node.arguments || node.arguments.length < 2) {
			return null;
		}

		// First argument is the namespace
		const namespaceArg = node.arguments[0];
		const namespace = this.extractStringValue(namespaceArg);
		if (!namespace) {
			return null;
		}

		// Second argument is the state array
		const stateArg = node.arguments[1];
		const state = this.extractStateFromArray(stateArg);

		return {
			namespace,
			state,
			actions: new Map(),
			callbacks: new Map(),
			sourceFile: filePath,
			sourceType: 'php',
			lastModified: Date.now()
		};
	}

	/**
	 * Extract string value from a PHP AST node
	 */
	private extractStringValue(node: any): string | null {
		if (node && node.kind === 'string') {
			return node.value;
		}
		return null;
	}

	/**
	 * Extract state properties from a PHP array
	 */
	private extractStateFromArray(node: any): Map<string, PropertyInfo> {
		const state = new Map<string, PropertyInfo>();

		if (!node || (node.kind !== 'array' && node.kind !== 'new')) {
			return state;
		}

		// Handle both array() and [] syntax
		const items = node.items || [];

		for (const item of items) {
			if (item && item.kind === 'entry') {
				// Get the key
				let key: string | null = null;

				if (item.key) {
					if (item.key.kind === 'string') {
						key = item.key.value;
					} else if (item.key.kind === 'identifier') {
						key = item.key.name;
					}
				}

				if (key) {
					const propertyInfo: PropertyInfo = {
						name: key,
						type: this.inferType(item.value),
						sourceLine: item.loc?.start?.line
					};

					// Check if value is an array/object
					if (item.value && (item.value.kind === 'array' || item.value.kind === 'new')) {
						propertyInfo.isObject = true;
						propertyInfo.properties = this.extractStateFromArray(item.value);
					}

					state.set(key, propertyInfo);
				}
			}
		}

		return state;
	}

	/**
	 * Infer type from a PHP value node
	 */
	private inferType(node: any): string | undefined {
		if (!node) {
			return undefined;
		}

		switch (node.kind) {
			case 'string':
				return 'string';
			case 'number':
				return 'number';
			case 'boolean':
				return 'boolean';
			case 'array':
			case 'new':
				return 'array';
			case 'nullkeyword':
				return 'null';
			default:
				return undefined;
		}
	}

	/**
	 * Traverse AST recursively
	 */
	private traverse(node: any, callback: (node: any) => void): void {
		if (!node || typeof node !== 'object') {
			return;
		}

		callback(node);

		// Traverse children
		for (const key in node) {
			if (node.hasOwnProperty(key)) {
				const child = node[key];
				if (Array.isArray(child)) {
					for (const item of child) {
						this.traverse(item, callback);
					}
				} else if (typeof child === 'object') {
					this.traverse(child, callback);
				}
			}
		}
	}
}
