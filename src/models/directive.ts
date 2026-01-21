import * as vscode from 'vscode';

/**
 * Information about a directive parsed from HTML
 */
export interface DirectiveInfo {
	/** Full directive name (e.g., "data-wp-bind--href") */
	name: string;

	/** Base directive name without suffix (e.g., "data-wp-bind") */
	baseName: string;

	/** Optional suffix for parameterized directives (e.g., "href" from data-wp-bind--href) */
	suffix?: string;

	/** The value of the directive attribute */
	value: string;

	/** The range of the directive in the document */
	range: vscode.Range;
}

/**
 * Definition of a directive from constants
 */
export interface DirectiveDefinition {
	/** Directive name or pattern */
	name: string;

	/** Display name for completion */
	displayName?: string;

	/** Category of the directive */
	category: DirectiveCategory;

	/** Whether this directive can be duplicated on the same element */
	allowDuplicates: boolean;

	/** Whether this directive requires a unique suffix (for bind, class, style, etc.) */
	requiresUniqueSuffix?: boolean;

	/** Whether multiple instances with unique IDs are allowed (for event handlers, watch, etc.) */
	allowMultipleWithUniqueId?: boolean;

	/** Documentation for the directive */
	documentation: string;

	/** Completion snippet template */
	snippet?: string;

	/** Expected value type */
	valueType?: DirectiveValueType;

	/** Whether this directive has a suffix pattern (e.g., data-wp-bind--${attr}) */
	hasSuffix?: boolean;
}

/**
 * Categories of directives
 */
export enum DirectiveCategory {
	Core = 'core',
	Attribute = 'attribute',
	Event = 'event',
	SideEffect = 'side-effect',
	List = 'list'
}

/**
 * Expected value types for directives
 */
export enum DirectiveValueType {
	Namespace = 'namespace',
	Expression = 'expression',
	Boolean = 'boolean',
	StateReference = 'state-reference',
	ContextReference = 'context-reference',
	ActionReference = 'action-reference',
	CallbackReference = 'callback-reference',
	Json = 'json'
}

/**
 * Result of directive validation
 */
export interface DirectiveValidationResult {
	/** Whether the directive usage is valid */
	isValid: boolean;

	/** Error message if invalid */
	message?: string;

	/** Severity of the issue */
	severity: vscode.DiagnosticSeverity;

	/** Range where the issue occurs */
	range?: vscode.Range;
}
