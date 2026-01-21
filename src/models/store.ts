/**
 * Definition of a store discovered from PHP or JavaScript
 */
export interface StoreDefinition {
	/** Namespace of the store */
	namespace: string;

	/** Global state properties */
	state: Map<string, PropertyInfo>;

	/** Action methods */
	actions: Map<string, MethodInfo>;

	/** Callback methods */
	callbacks: Map<string, MethodInfo>;

	/** Source file where this store was defined */
	sourceFile: string;

	/** Type of source file */
	sourceType: 'php' | 'javascript';

	/** Last modified timestamp */
	lastModified: number;
}

/**
 * Information about a property in the store
 */
export interface PropertyInfo {
	/** Property name */
	name: string;

	/** Inferred or declared type */
	type?: string;

	/** Whether this is a nested object */
	isObject?: boolean;

	/** Nested properties if this is an object */
	properties?: Map<string, PropertyInfo>;

	/** Source location (line number) */
	sourceLine?: number;
}

/**
 * Information about a method in the store
 */
export interface MethodInfo {
	/** Method name */
	name: string;

	/** Parameter names if available */
	parameters?: string[];

	/** Return type if available */
	returnType?: string;

	/** Source location (line number) */
	sourceLine?: number;
}

/**
 * Context for providing completions
 */
export interface CompletionContext {
	/** Current namespace (from nearest data-wp-interactive) */
	namespace?: string;

	/** Available store for this context */
	store?: StoreDefinition;

	/** Current prefix being typed (e.g., "state.", "actions.") */
	prefix?: string;

	/** Whether we're in a cross-namespace reference (e.g., "otherPlugin::") */
	isCrossNamespace?: boolean;

	/** Target namespace for cross-namespace reference */
	targetNamespace?: string;
}
