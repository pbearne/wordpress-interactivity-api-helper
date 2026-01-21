import { StoreDefinition } from '../models/store';

/**
 * Central registry for discovered stores
 */
export class StoreRegistry {
	private stores: Map<string, StoreDefinition> = new Map();
	private directoryStores: Map<string, Set<string>> = new Map(); // directory -> namespaces

	/**
	 * Add a store to the registry
	 */
	public addStore(store: StoreDefinition): void {
		this.stores.set(store.namespace, store);

		// Track which directory this store belongs to
		const directory = this.getDirectory(store.sourceFile);
		if (!this.directoryStores.has(directory)) {
			this.directoryStores.set(directory, new Set());
		}
		this.directoryStores.get(directory)!.add(store.namespace);
	}

	/**
	 * Get a store by namespace
	 */
	public getStore(namespace: string): StoreDefinition | undefined {
		return this.stores.get(namespace);
	}

	/**
	 * Get all stores for a specific directory
	 */
	public getStoresForDirectory(directory: string): StoreDefinition[] {
		const namespaces = this.directoryStores.get(directory);
		if (!namespaces) {
			return [];
		}

		const stores: StoreDefinition[] = [];
		for (const namespace of namespaces) {
			const store = this.stores.get(namespace);
			if (store) {
				stores.push(store);
			}
		}

		return stores;
	}

	/**
	 * Get all stores
	 */
	public getAllStores(): StoreDefinition[] {
		return Array.from(this.stores.values());
	}

	/**
	 * Check if a store exists
	 */
	public hasStore(namespace: string): boolean {
		return this.stores.has(namespace);
	}

	/**
	 * Remove a store from the registry
	 */
	public removeStore(namespace: string): void {
		const store = this.stores.get(namespace);
		if (store) {
			// Remove from directory tracking
			const directory = this.getDirectory(store.sourceFile);
			const dirStores = this.directoryStores.get(directory);
			if (dirStores) {
				dirStores.delete(namespace);
				if (dirStores.size === 0) {
					this.directoryStores.delete(directory);
				}
			}

			this.stores.delete(namespace);
		}
	}

	/**
	 * Clear all stores for a directory
	 */
	public clearDirectory(directory: string): void {
		const namespaces = this.directoryStores.get(directory);
		if (namespaces) {
			for (const namespace of namespaces) {
				this.stores.delete(namespace);
			}
			this.directoryStores.delete(directory);
		}
	}

	/**
	 * Clear all stores
	 */
	public clear(): void {
		this.stores.clear();
		this.directoryStores.clear();
	}

	/**
	 * Get directory from file path
	 */
	private getDirectory(filePath: string): string {
		const parts = filePath.split(/[/\\]/);
		parts.pop(); // Remove filename
		return parts.join('/');
	}

	/**
	 * Merge a store with an existing one (for cases where multiple files define the same namespace)
	 */
	public mergeStore(newStore: StoreDefinition): void {
		const existing = this.stores.get(newStore.namespace);
		if (!existing) {
			this.addStore(newStore);
			return;
		}

		// Merge state properties
		for (const [key, value] of newStore.state.entries()) {
			existing.state.set(key, value);
		}

		// Merge actions
		for (const [key, value] of newStore.actions.entries()) {
			existing.actions.set(key, value);
		}

		// Merge callbacks
		for (const [key, value] of newStore.callbacks.entries()) {
			existing.callbacks.set(key, value);
		}

		// Update timestamp
		existing.lastModified = Math.max(existing.lastModified, newStore.lastModified);
	}
}
