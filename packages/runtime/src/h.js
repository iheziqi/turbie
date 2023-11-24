import { withoutNulls } from './utils/arrays';

export const DOM_TYPES = {
	TEXT: 'text', // They represent text content.
	ELEMENT: 'element', // The most common type of node; they represent HTML elements that have a tag name.
	FRAGMENT: 'fragment', // They represent a collection of nodes that don't have a parent node.
};

/**
 * Creates a virtual DOM element.
 * h() is short for hyperscript, or a script that creates hypertext.
 *
 * @param {string} tag - The HTML tag of the element.
 * @param {Object} [props={}] - The properties or attributes of the element.
 * @param {Array} [children=[]] - The child elements or text nodes.
 *
 * @returns {Object} A virtual DOM element representation.
 *
 */
export function h(tag, props = {}, children = []) {
	return {
		tag,
		props,
		// Child nodes might come as null, so needed to filter them out.
		// If some child nodes inside the children array are strings, it is needed to transform
		// them into virtual nodes of type DOM_TYPES.TEXT.
		children: mapTextNodes(withoutNulls(children)),
		type: DOM_TYPES.ELEMENT,
	};
}

/**
 * Map strings in children array to text nodes.
 * @param {Array} children - The children array of a element node.
 * @returns {Array} The children array with strings replaced by text nodes.
 */
function mapTextNodes(children) {
	return children.map((child) =>
		typeof child === 'string' ? hString(child) : child
	);
}

/**
 * Create text node from given string.
 * @param {String} str
 * @returns The text node created from the given string.
 */
export function hString(str) {
	return { type: DOM_TYPES.TEXT, value: str };
}

/**
 * Creates a virtual DOM fragment.
 *
 * @param {Array} vNodes - An array of virtual DOM nodes or text nodes to be included in the fragment.
 * @returns {Object} A virtual DOM fragment representation.
 */
export function hFragment(vNodes) {
	// A fragment is type of virtual node used to group multiple nodes that need to be attached
	// to the DOM together, but don't have a parent node in the DOM.
	// Fragments are just an array of child nodes.
	return {
		type: DOM_TYPES.FRAGMENT,
		children: mapTextNodes(withoutNulls(vNodes)),
	};
}
