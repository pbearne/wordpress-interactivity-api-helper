import * as vscode from 'vscode';
import { StoreRegistry } from '../parsers/storeParser';

/**
 * Validates that data-wp-interactive namespaces have corresponding stores
 */
export class NamespaceValidator {
	private diagnosticCollection: vscode.DiagnosticCollection;
	private debounceTimer: NodeJS.Timeout | null = null;

	constructor(private registry: StoreRegistry) {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection('wpInteractivityAPI-namespace');
	}

	/**
	 * Schedule validation with debouncing
	 */
	public scheduleValidation(document: vscode.TextDocument): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.validateDocument(document);
		}, 500);
	}

	/**
	 * Validate a document for namespace issues
	 */
	public validateDocument(document: vscode.TextDocument): void {
		if (document.languageId !== 'php' && document.languageId !== 'html') {
			return;
		}

		const diagnostics: vscode.Diagnostic[] = [];
		const text = document.getText();

		// Find all data-wp-interactive attributes
		const interactiveRegex = /data-wp-interactive\s*=\s*["']([^"']+)["']/g;
		let match;

		while ((match = interactiveRegex.exec(text)) !== null) {
			const namespace = match[1];
			const namespaceStart = match.index + match[0].indexOf(namespace);
			const namespaceEnd = namespaceStart + namespace.length;

			// Check if a store exists for this namespace
			const store = this.registry.getStore(namespace);

			if (!store) {
				// Get all available store namespaces for the suggestion
				const availableStores = this.registry.getAllStores();
				const availableNamespaces = availableStores.map(s => s.namespace);

				const range = new vscode.Range(
					document.positionAt(namespaceStart),
					document.positionAt(namespaceEnd)
				);

				let message = `No store found for namespace "${namespace}".`;

				if (availableNamespaces.length > 0) {
					// Check for similar namespaces (typo detection)
					const similar = this.findSimilarNamespace(namespace, availableNamespaces);
					if (similar) {
						message += ` Did you mean "${similar}"?`;
					} else {
						message += ` Available stores: ${availableNamespaces.join(', ')}`;
					}
				} else {
					message += ' No stores found in the current directory.';
				}

				const diagnostic = new vscode.Diagnostic(
					range,
					message,
					vscode.DiagnosticSeverity.Warning
				);

				diagnostic.source = 'WordPress Interactivity API';
				diagnostic.code = 'namespace-not-found';

				diagnostics.push(diagnostic);
			}
		}

		this.diagnosticCollection.set(document.uri, diagnostics);
	}

	/**
	 * Find similar namespace (for typo suggestions)
	 */
	private findSimilarNamespace(target: string, available: string[]): string | null {
		let bestMatch: string | null = null;
		let bestDistance = Infinity;

		for (const candidate of available) {
			const distance = this.levenshteinDistance(target, candidate);
			// Only suggest if distance is small (likely typo) and less than half the length
			if (distance < bestDistance && distance <= Math.floor(target.length / 2)) {
				bestDistance = distance;
				bestMatch = candidate;
			}
		}

		return bestMatch;
	}

	/**
	 * Calculate Levenshtein distance between two strings
	 */
	private levenshteinDistance(a: string, b: string): number {
		const matrix: number[][] = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	/**
	 * Clear diagnostics for a document
	 */
	public clearDiagnostics(document: vscode.TextDocument): void {
		this.diagnosticCollection.delete(document.uri);
	}

	/**
	 * Dispose of resources
	 */
	public dispose(): void {
		this.diagnosticCollection.dispose();
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
	}
}
