import * as vscode from 'vscode';
import { DirectiveInfo } from '../models/directive';
import { getDirectiveDefinition } from '../constants/directives';
import { HtmlParser } from '../utils/htmlParser';

/**
 * Validator for detecting duplicate directives on elements
 */
export class DuplicateValidator {
	private diagnosticCollection: vscode.DiagnosticCollection;

	constructor() {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection(
			'wordpress-interactivity-api'
		);
	}

	/**
	 * Validate a document for duplicate directives
	 */
	public validateDocument(document: vscode.TextDocument): void {
		// Check if validation is enabled
		const config = vscode.workspace.getConfiguration('wpInteractivityAPI');
		if (!config.get<boolean>('enableDuplicateWarnings', true)) {
			this.diagnosticCollection.clear();
			return;
		}

		const diagnostics: vscode.Diagnostic[] = [];

		// Parse the document and find all elements with directives
		// For now, we'll validate as we find elements during completion
		// A full document scan would be more comprehensive but also more expensive

		this.diagnosticCollection.set(document.uri, diagnostics);
	}

	/**
	 * Validate directives on a specific element
	 */
	public validateElement(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.Diagnostic[] {
		const diagnostics: vscode.Diagnostic[] = [];

		// Find element at position
		const element = HtmlParser.findElementAtPosition(document, position);
		if (!element) {
			return diagnostics;
		}

		// Extract directives
		const directives = HtmlParser.extractDirectives(element, document);

		// Check for duplicates
		const violations = this.checkDuplicates(directives);

		// Convert violations to diagnostics
		for (const violation of violations) {
			const diagnostic = new vscode.Diagnostic(
				violation.range,
				violation.message,
				vscode.DiagnosticSeverity.Warning
			);
			diagnostic.source = 'WordPress Interactivity API';
			diagnostics.push(diagnostic);
		}

		return diagnostics;
	}

	/**
	 * Check for duplicate directives according to the rules
	 */
	private checkDuplicates(directives: DirectiveInfo[]): Array<{
		range: vscode.Range;
		message: string;
	}> {
		const violations: Array<{ range: vscode.Range; message: string }> = [];
		const seen = new Map<string, DirectiveInfo>();

		for (const directive of directives) {
			const definition = getDirectiveDefinition(directive.baseName);
			if (!definition) {
				continue;
			}

			// Check if this exact directive already exists
			if (!definition.allowDuplicates && !definition.allowMultipleWithUniqueId) {
				if (seen.has(directive.baseName)) {
					violations.push({
						range: directive.range,
						message: `"${directive.baseName}" cannot be duplicated on the same element.`
					});
				} else {
					seen.set(directive.baseName, directive);
				}
				continue;
			}

			// For directives with unique suffix requirement (bind, class, style)
			if (definition.requiresUniqueSuffix) {
				if (seen.has(directive.name)) {
					violations.push({
						range: directive.range,
						message: `"${directive.name}" is already defined on this element. Each ${directive.baseName} must have a unique suffix.`
					});
				} else {
					seen.set(directive.name, directive);
				}
				continue;
			}

			// For directives that allow multiple with unique IDs (event handlers, watch, etc.)
			// These are allowed, so no violation
			if (definition.allowMultipleWithUniqueId) {
				// No validation needed - multiple instances are explicitly allowed
				continue;
			}
		}

		return violations;
	}

	/**
	 * Clear all diagnostics
	 */
	public clear(): void {
		this.diagnosticCollection.clear();
	}

	/**
	 * Dispose of the diagnostic collection
	 */
	public dispose(): void {
		this.diagnosticCollection.dispose();
	}
}
