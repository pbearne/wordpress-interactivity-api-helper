import { DirectiveDefinition, DirectiveCategory, DirectiveValueType } from '../models/directive';

/**
 * Complete list of WordPress Interactivity API directives with their definitions
 */
export const DIRECTIVES: DirectiveDefinition[] = [
	// Core directives
	{
		name: 'data-wp-interactive',
		category: DirectiveCategory.Core,
		allowDuplicates: false,
		documentation: 'Activates the Interactivity API for this element and its children. Defines the namespace to reference a specific store.',
		snippet: 'data-wp-interactive="$1"',
		valueType: DirectiveValueType.Namespace
	},
	{
		name: 'data-wp-context',
		category: DirectiveCategory.Core,
		allowDuplicates: false,
		documentation: 'Provides local state available to a specific element and its children. Context is local only to the element and descendants.',
		snippet: 'data-wp-context=\'{"$1": $2}\'',
		valueType: DirectiveValueType.Json
	},

	// Attribute directives
	{
		name: 'data-wp-bind',
		displayName: 'data-wp-bind--[attribute]',
		category: DirectiveCategory.Attribute,
		allowDuplicates: true,
		requiresUniqueSuffix: true,
		hasSuffix: true,
		documentation: 'Sets HTML attributes based on boolean or string values. Use data-wp-bind--[attribute]="reference".',
		snippet: 'data-wp-bind--$1="$2"',
		valueType: DirectiveValueType.Expression
	},
	{
		name: 'data-wp-class',
		displayName: 'data-wp-class--[className]',
		category: DirectiveCategory.Attribute,
		allowDuplicates: true,
		requiresUniqueSuffix: true,
		hasSuffix: true,
		documentation: 'Adds or removes CSS classes based on boolean values. Use kebab-case for class names.',
		snippet: 'data-wp-class--$1="$2"',
		valueType: DirectiveValueType.Expression
	},
	{
		name: 'data-wp-style',
		displayName: 'data-wp-style--[property]',
		category: DirectiveCategory.Attribute,
		allowDuplicates: true,
		requiresUniqueSuffix: true,
		hasSuffix: true,
		documentation: 'Applies inline CSS properties dynamically based on state values.',
		snippet: 'data-wp-style--$1="$2"',
		valueType: DirectiveValueType.Expression
	},
	{
		name: 'data-wp-text',
		category: DirectiveCategory.Attribute,
		allowDuplicates: false,
		documentation: 'Sets the element\'s inner text content based on store values.',
		snippet: 'data-wp-text="$1"',
		valueType: DirectiveValueType.StateReference
	},

	// Event directives
	{
		name: 'data-wp-on',
		displayName: 'data-wp-on--[event]',
		category: DirectiveCategory.Event,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		hasSuffix: true,
		documentation: 'Attaches event listeners to elements for DOM events. Provides synchronous event object access.',
		snippet: 'data-wp-on--$1="actions.$2"',
		valueType: DirectiveValueType.ActionReference
	},
	{
		name: 'data-wp-on-async',
		displayName: 'data-wp-on-async--[event]',
		category: DirectiveCategory.Event,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		hasSuffix: true,
		documentation: 'Asynchronous event handler variant with better performance when event object is not needed.',
		snippet: 'data-wp-on-async--$1="actions.$2"',
		valueType: DirectiveValueType.ActionReference
	},
	{
		name: 'data-wp-on-window',
		displayName: 'data-wp-on-window--[event]',
		category: DirectiveCategory.Event,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		hasSuffix: true,
		documentation: 'Attaches global window event listeners. Automatically removes listeners when element leaves DOM.',
		snippet: 'data-wp-on-window--$1="callbacks.$2"',
		valueType: DirectiveValueType.CallbackReference
	},
	{
		name: 'data-wp-on-async-window',
		displayName: 'data-wp-on-async-window--[event]',
		category: DirectiveCategory.Event,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		hasSuffix: true,
		documentation: 'Async-optimized window events with passive listener support for better performance.',
		snippet: 'data-wp-on-async-window--$1="callbacks.$2"',
		valueType: DirectiveValueType.CallbackReference
	},
	{
		name: 'data-wp-on-document',
		displayName: 'data-wp-on-document--[event]',
		category: DirectiveCategory.Event,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		hasSuffix: true,
		documentation: 'Binds document-level events. Automatic cleanup on element removal.',
		snippet: 'data-wp-on-document--$1="callbacks.$2"',
		valueType: DirectiveValueType.CallbackReference
	},
	{
		name: 'data-wp-on-async-document',
		displayName: 'data-wp-on-async-document--[event]',
		category: DirectiveCategory.Event,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		hasSuffix: true,
		documentation: 'Performant document event variant using passive listeners.',
		snippet: 'data-wp-on-async-document--$1="callbacks.$2"',
		valueType: DirectiveValueType.CallbackReference
	},

	// Side effect directives
	{
		name: 'data-wp-watch',
		category: DirectiveCategory.SideEffect,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		documentation: 'Runs callbacks when node is created and when state/context changes. Can return cleanup functions.',
		snippet: 'data-wp-watch="callbacks.$1"',
		valueType: DirectiveValueType.CallbackReference
	},
	{
		name: 'data-wp-init',
		category: DirectiveCategory.SideEffect,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		documentation: 'Executes only during element creation (initialization). Can return cleanup function that runs when element is removed.',
		snippet: 'data-wp-init="callbacks.$1"',
		valueType: DirectiveValueType.CallbackReference
	},
	{
		name: 'data-wp-run',
		category: DirectiveCategory.SideEffect,
		allowDuplicates: true,
		allowMultipleWithUniqueId: true,
		documentation: 'Executes during render execution. Enables hook composition (useState, useWatch, useEffect).',
		snippet: 'data-wp-run="callbacks.$1"',
		valueType: DirectiveValueType.CallbackReference
	},

	// List directives
	{
		name: 'data-wp-key',
		category: DirectiveCategory.List,
		allowDuplicates: false,
		documentation: 'Assigns unique keys to elements in list iterations to maintain state consistency across renders.',
		snippet: 'data-wp-key="$1"',
		valueType: DirectiveValueType.Expression
	},
	{
		name: 'data-wp-each',
		category: DirectiveCategory.List,
		allowDuplicates: false,
		documentation: 'Renders lists by iterating over array data. Automatically updates when array changes.',
		snippet: 'data-wp-each--$1="$2"',
		valueType: DirectiveValueType.StateReference
	},
	{
		name: 'data-wp-each-child',
		category: DirectiveCategory.List,
		allowDuplicates: false,
		documentation: 'Designates child elements within wp-each loops for iteration. Added automatically on server processing.',
		snippet: 'data-wp-each-child',
		valueType: DirectiveValueType.Expression
	}
];

/**
 * Map of directive base names to their definitions for quick lookup
 */
export const DIRECTIVE_MAP = new Map<string, DirectiveDefinition>(
	DIRECTIVES.map(d => [d.name, d])
);

/**
 * Get directive definition by name
 */
export function getDirectiveDefinition(name: string): DirectiveDefinition | undefined {
	// Check exact match first
	if (DIRECTIVE_MAP.has(name)) {
		return DIRECTIVE_MAP.get(name);
	}

	// Check if this is a suffixed directive (e.g., data-wp-bind--href)
	const baseName = name.split('--')[0];
	return DIRECTIVE_MAP.get(baseName);
}

/**
 * Check if a directive allows duplicates
 */
export function allowsDuplicates(directiveName: string): boolean {
	const def = getDirectiveDefinition(directiveName);
	if (!def) {
		return false;
	}

	return def.allowDuplicates || def.allowMultipleWithUniqueId || false;
}

/**
 * Check if directive requires a unique suffix (like bind, class, style)
 */
export function requiresUniqueSuffix(directiveName: string): boolean {
	const def = getDirectiveDefinition(directiveName);
	return def?.requiresUniqueSuffix || false;
}
