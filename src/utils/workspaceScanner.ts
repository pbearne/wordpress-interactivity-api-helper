import * as vscode from 'vscode';
import * as path from 'path';
import { StoreRegistry } from '../parsers/storeParser';
import { PhpStoreParser } from '../parsers/phpStoreParser';
import { JsStoreParser } from '../parsers/jsStoreParser';
import { ContextParser } from '../parsers/contextParser';

/**
 * Scans workspace for store definitions (directory-scoped)
 */
export class WorkspaceScanner {
	private phpParser: PhpStoreParser;
	private jsParser: JsStoreParser;
	private contextParser: ContextParser;
	private fileWatcher: vscode.FileSystemWatcher | null = null;
	private currentDirectory: string | null = null;
	private debounceTimer: NodeJS.Timeout | null = null;
	private fileCache: Map<string, { content: string; hash: string }> = new Map();

	constructor(private registry: StoreRegistry) {
		this.phpParser = new PhpStoreParser();
		this.jsParser = new JsStoreParser();
		this.contextParser = new ContextParser();
	}

	/**
	 * Scan directory for store definitions
	 */
	public async scanDirectory(directory: string): Promise<void> {
		console.log('[WP Interactivity API] Scanning directory:', directory);

		// Clear previous directory stores if switching directories
		if (this.currentDirectory && this.currentDirectory !== directory) {
			this.registry.clearDirectory(this.currentDirectory);
		}

		this.currentDirectory = directory;

		// Find all PHP and JS files in the directory
		const phpFiles = await vscode.workspace.findFiles(
			new vscode.RelativePattern(directory, '*.php'),
			null,
			100
		);

		const jsFiles = await vscode.workspace.findFiles(
			new vscode.RelativePattern(directory, '*.{js,ts,jsx,tsx}'),
			null,
			100
		);

		console.log('[WP Interactivity API] Found files:', {
			php: phpFiles.length,
			js: jsFiles.length,
			jsFiles: jsFiles.map(f => path.basename(f.fsPath))
		});

		// Parse PHP files
		for (const file of phpFiles) {
			await this.parseFile(file);
		}

		// Parse JS files
		for (const file of jsFiles) {
			await this.parseFile(file);
		}

		const allStores = this.registry.getAllStores();
		console.log('[WP Interactivity API] Total stores found:', allStores.length);
		allStores.forEach(store => {
			console.log('[WP Interactivity API] Store:', store.namespace, {
				state: Array.from(store.state.keys()),
				actions: Array.from(store.actions.keys()),
				callbacks: Array.from(store.callbacks.keys())
			});
		});
	}

	/**
	 * Scan the directory of the active document
	 */
	public async scanActiveDirectory(): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const document = editor.document;
		if (document.languageId !== 'php' && document.languageId !== 'html') {
			return;
		}

		const directory = path.dirname(document.uri.fsPath);
		await this.scanDirectory(directory);

		// Parse inline contexts from the active document
		if (document.languageId === 'php' || document.languageId === 'html') {
			this.parseInlineContexts(document);
		}

		// Set up file watcher for this directory
		this.setupFileWatcher(directory);
	}

	/**
	 * Parse a single file
	 */
	private async parseFile(fileUri: vscode.Uri): Promise<void> {
		try {
			const content = await vscode.workspace.fs.readFile(fileUri);
			const contentString = Buffer.from(content).toString('utf8');
			const filePath = fileUri.fsPath;

			// Check cache
			const hash = this.hashString(contentString);
			const cached = this.fileCache.get(filePath);
			if (cached && cached.hash === hash) {
				return; // File hasn't changed
			}

			// Update cache
			this.fileCache.set(filePath, { content: contentString, hash });

			// Parse based on file extension
			const ext = path.extname(filePath).toLowerCase();

			if (ext === '.php') {
				const stores = this.phpParser.parseFile(contentString, filePath);
				for (const store of stores) {
					this.registry.mergeStore(store);
				}
			} else if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
				const stores = this.jsParser.parseFile(contentString, filePath);
				for (const store of stores) {
					this.registry.mergeStore(store);
				}
			}
		} catch (error) {
			console.error(`Error parsing file ${fileUri.fsPath}:`, error);
		}
	}

	/**
	 * Parse inline context attributes from a document
	 */
	private parseInlineContexts(document: vscode.TextDocument): void {
		const config = vscode.workspace.getConfiguration('wpInteractivityAPI');
		if (!config.get<boolean>('parseInlineContexts', true)) {
			return;
		}

		const content = document.getText();
		const contexts = this.contextParser.parseDocumentContexts(content);

		// Add context properties to a temporary store
		// These will be merged with any existing store for the same namespace
		for (const contextProps of contexts) {
			// Create a temporary store for inline contexts
			const tempStore = {
				namespace: '_inline_context_',
				state: contextProps,
				actions: new Map(),
				callbacks: new Map(),
				sourceFile: document.uri.fsPath,
				sourceType: 'php' as const,
				lastModified: Date.now()
			};

			this.registry.mergeStore(tempStore);
		}
	}

	/**
	 * Set up file watcher for a directory
	 */
	private setupFileWatcher(directory: string): void {
		// Dispose existing watcher
		if (this.fileWatcher) {
			this.fileWatcher.dispose();
		}

		// Create new watcher for PHP and JS files in the directory
		const pattern = new vscode.RelativePattern(directory, '*.{php,js,ts,jsx,tsx}');
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

		// Watch for changes
		this.fileWatcher.onDidChange(uri => {
			this.debouncedParse(uri);
		});

		this.fileWatcher.onDidCreate(uri => {
			this.debouncedParse(uri);
		});

		this.fileWatcher.onDidDelete(uri => {
			// Remove file from cache
			this.fileCache.delete(uri.fsPath);
			// Note: We don't remove stores here as a store might be defined in multiple files
		});
	}

	/**
	 * Debounced file parsing to avoid excessive reparsing
	 */
	private debouncedParse(uri: vscode.Uri): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.parseFile(uri);
		}, 300);
	}

	/**
	 * Simple string hash function
	 */
	private hashString(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash.toString();
	}

	/**
	 * Dispose of resources
	 */
	public dispose(): void {
		if (this.fileWatcher) {
			this.fileWatcher.dispose();
		}
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
	}
}
