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

		// Parse the entire document to find all elements with duplicate directives
		const text = document.getText();

		// Find all opening tags in the document
		const tagRegex = /<(\w+)([^>]*)>/g;
		let match;

		while ((match = tagRegex.exec(text)) !== null) {
			const attributesText = match[2];
			const tagStart = match.index;

			// Extract all directives from this tag's attributes
			const directives = this.extractDirectivesFromAttributes(
				attributesText,
				tagStart,
				document
			);

			// Check for duplicates on this element
			const violations = this.checkDuplicates(directives);
			diagnostics.push(...violations.map(v => {
				const diagnostic = new vscode.Diagnostic(
					v.range,
					v.message,
					vscode.DiagnosticSeverity.Warning
				);
				diagnostic.source = 'WordPress Interactivity API';
				return diagnostic;
			}));
		}

		this.diagnosticCollection.set(document.uri, diagnostics);
	}

	/**
	 * Extract directives from an attributes string
	 */
	private extractDirectivesFromAttributes(
		attributesText: string,
		tagStartOffset: number,
		document: vscode.TextDocument
	): DirectiveInfo[] {
		const directives: DirectiveInfo[] = [];

		// Match all data-wp-* attributes
		const attrRegex = /(data-wp-[\w-]+)\s*=\s*["']([^"']*)["']/g;
		let match;

		while ((match = attrRegex.exec(attributesText)) !== null) {
			const name = match[1];
			const value = match[2];
			const baseName = name.split('--')[0];
			const suffix = name.includes('--') ? name.split('--').slice(1).join('--') : undefined;

			// Calculate the range of this attribute in the document
			const attrStartInTag = match.index;
			const attrStart = tagStartOffset + attrStartInTag;
			const attrEnd = attrStart + match[0].length;

			const range = new vscode.Range(
				document.positionAt(attrStart),
				document.positionAt(attrEnd)
			);

			directives.push({
				name,
				baseName,
				suffix,
				value,
				range
			});
		}

		return directives;
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
			if (definition.allowMultipleWithUniqueId) {
				// Check if this exact directive name (including suffix) already exists
				const fullName = directive.name;
				if (seen.has(fullName)) {
					// This is a duplicate - suggest using ---id
					violations.push({
						range: directive.range,
						message: `"${fullName}" is already defined on this element. To add multiple instances, use unique identifiers: "${fullName}---id1", "${fullName}---id2".`
					});
				} else {
					seen.set(fullName, directive);
				}
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
