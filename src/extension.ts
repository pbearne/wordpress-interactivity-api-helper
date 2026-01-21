import * as vscode from 'vscode';
import { DirectiveCompletionProvider } from './providers/directiveCompletionProvider';
import { ValueCompletionProvider } from './providers/valueCompletionProvider';
import { DuplicateValidator } from './validators/duplicateValidator';
import { StoreRegistry } from './parsers/storeParser';
import { WorkspaceScanner } from './utils/workspaceScanner';

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('WordPress Interactivity API Helper is now active');

	// Initialize store registry
	const storeRegistry = new StoreRegistry();

	// Initialize workspace scanner
	const workspaceScanner = new WorkspaceScanner(storeRegistry);

	// Initialize duplicate validator
	const duplicateValidator = new DuplicateValidator();

	// Initialize completion providers
	const directiveCompletionProvider = new DirectiveCompletionProvider();
	const valueCompletionProvider = new ValueCompletionProvider(storeRegistry);

	// Languages to support
	const supportedLanguages = ['php', 'html'];

	// Register directive completion provider
	for (const language of supportedLanguages) {
		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(
				{ language, scheme: 'file' },
				directiveCompletionProvider,
				'-', // Trigger on dash (for data-)
				'=' // Trigger on equals (for attribute values)
			)
		);
	}

	// Register value completion provider
	for (const language of supportedLanguages) {
		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(
				{ language, scheme: 'file' },
				valueCompletionProvider,
				'"', // Trigger on opening quote
				"'", // Trigger on single quote
				'.', // Trigger on dot (for property access)
				':'  // Trigger on colon (for namespace references)
			)
		);
	}

	// Scan directory when a document is opened or switched
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(async editor => {
			if (editor) {
				const document = editor.document;
				if (document.languageId === 'php' || document.languageId === 'html') {
					console.log('[WP Interactivity API] Scanning directory for:', document.uri.fsPath);
					await workspaceScanner.scanActiveDirectory();
				}
			}
		})
	);

	// Also scan on activation if there's an active editor
	if (vscode.window.activeTextEditor) {
		const document = vscode.window.activeTextEditor.document;
		if (document.languageId === 'php' || document.languageId === 'html') {
			console.log('[WP Interactivity API] Initial scan for:', document.uri.fsPath);
			workspaceScanner.scanActiveDirectory();
		}
	}

	// Validate documents for duplicate directives on change
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			const document = event.document;
			if (document.languageId === 'php' || document.languageId === 'html') {
				duplicateValidator.validateDocument(document);
			}
		})
	);

	// Validate documents when they are opened or become visible
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				const document = editor.document;
				if (document.languageId === 'php' || document.languageId === 'html') {
					duplicateValidator.validateDocument(document);
				}
			}
		})
	);

	// Validate the active document on activation
	if (vscode.window.activeTextEditor) {
		const document = vscode.window.activeTextEditor.document;
		if (document.languageId === 'php' || document.languageId === 'html') {
			duplicateValidator.validateDocument(document);
		}
	}

	// Register refresh command
	context.subscriptions.push(
		vscode.commands.registerCommand('wpInteractivityAPI.refreshStores', async () => {
			storeRegistry.clear();
			await workspaceScanner.scanActiveDirectory();
			vscode.window.showInformationMessage(
				'WordPress Interactivity API: Store cache refreshed'
			);
		})
	);

	// Register command to show available stores
	context.subscriptions.push(
		vscode.commands.registerCommand('wpInteractivityAPI.showStores', () => {
			const stores = storeRegistry.getAllStores();
			if (stores.length === 0) {
				vscode.window.showInformationMessage(
					'No stores found. Open a PHP or HTML file to scan for stores.'
				);
				return;
			}

			const storeList = stores
				.map(store => {
					const stateCount = store.state.size;
					const actionsCount = store.actions.size;
					const callbacksCount = store.callbacks.size;

					return `• ${store.namespace} (${stateCount} state, ${actionsCount} actions, ${callbacksCount} callbacks)`;
				})
				.join('\n');

			vscode.window.showInformationMessage(
				`Found ${stores.length} store(s):\n${storeList}`,
				{ modal: true }
			);
		})
	);

	// Clean up on dispose
	context.subscriptions.push({
		dispose: () => {
			duplicateValidator.dispose();
			workspaceScanner.dispose();
		}
	});
}

/**
 * Extension deactivation
 */
export function deactivate() {
	console.log('WordPress Interactivity API Helper has been deactivated');
}
