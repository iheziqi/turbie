import { DOM_TYPES } from './h';
import { addEventListeners } from './events';
import { setAttributes } from './attributes';

/**
 * Creates the DOM nodes for a virtual DOM tree, mounts them in the DOM, and
 * modifies the vdom tree to include the corresponding DOM nodes and event listeners.
 *
 * @param {Object} vdom the virtual DOM node to mount
 * @param {HTMLElement} parentEl the host element to mount the virtual DOM node to
 */

export function mountDOM(vdom, parentEl) {
	switch (vdom.type) {
		case DOM_TYPES.TEXT:
			createTextNode(vdom, parentEl);
			break;
		case DOM_TYPES.ELEMENT:
			createElementNode(vdom, parentEl);
			break;
		case DOM_TYPES.FRAGMENT:
			createFragmentNodes(vdom, parentEl);
			break;
		default:
			throw new Error(`Can't mount DOM of type: ${vdom.type}`);
	}
}

/**
 * Creates the text node for a virtual DOM text node.
 * The created `Text` is added to the `el` property of the vdom.
 *
 * Note that `Text` is a subclass of `CharacterData`, which is a subclass of `Node`,
 * but not of `Element`. Methods like `append()`, `prepend()`, `before()`, `after()`,
 * or `remove()` are not available on `Text` nodes.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Text}
 *
 * @param {Object} vdom the virtual DOM node of type "text"
 * @param {Element} parentEl the host element to mount the virtual DOM node to
 */
function createTextNode(vdom, parentEl) {
	const { value } = vdom;

	const textNode = document.createTextNode(value);
	// el saves a reference to the real DOM node in the virtual node.
	// This reference is used by the reconciliation algorithm.
	vdom.el = textNode;

	parentEl.append(textNode);
}

/**
 * Creates the fragment for a virtual DOM fragment node and its children recursively.
 * The vdom's `el` property is set to be the `parentEl` passed to the function.
 * This is because a fragment loses its children when it is appended to the DOM, so
 * we can't use it to reference the fragment's children.
 *
 * Note that `DocumentFragment` is a subclass of `Node`, but not of `Element`.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment}
 *
 * @param {Object} vdom the virtual DOM node of type "fragment"
 * @param {Element} parentEl the host element to mount the virtual DOM node to
 */
function createFragmentNodes(vdom, parentEl) {
	const { children } = vdom;
	// el saves a reference to the real DOM node in the virtual node.
	// This reference is used by the reconciliation algorithm.
	vdom.el = parentEl;

	children.forEach((child) => mountDOM(child, parentEl));
}

/**
 * Creates the HTML element for a virtual DOM element node and its children recursively.
 * The created `Element` is added to the `el` property of the vdom.
 *
 * If the vdom includes event listeners, these are added to the vdom object, under the
 * `listeners` property.
 *
 * @param {Object} vdom the virtual DOM node of type "element"
 * @param {Element} parentEl the host element to mount the virtual DOM node to
 */
function createElementNode(vdom, parentEl) {
	// The virtual DOM representation of a node like this:
	// {
	// 	type: DOM_TYPES.ELEMENT,
	// 	tag: 'button',
	// 	props: {
	// 		on: {
	// 			mouseover: () => console.log('almost yay!'),
	// 			click: () => console.log('yay!'),
	// 			dblclick: () => console.log('double yay!'),
	// 		},
	// 	},
	// };
	// or:
	// {
	// 	type: DOM_TYPES.ELEMENT,
	// 	tag: 'button',
	// 	props: {
	// 		class: 'btn',
	// 		on: { click: () => console.log('yay!') },
	// 	},
	// 	children: [
	// 		{
	// 			type: DOM_TYPES.TEXT,
	// 			value: 'Click me!',
	// 		},
	// 	],
	// };
	const { tag, props, children } = vdom;

	// 1. Create the element node using the document.createElement() function.
	const element = document.createElement(tag);

	// 2. Add the attributes and event listeners to the element node,
	// saving the added event listeners in a new property of the virtual node, called listeners.
	addProps(element, props, vdom);

	// 3. Save a reference to the element node in the virtual node.
	vdom.el = element;

	// 4. Mount the children, recursively, into the element node
	children.forEach((child) => mountDOM(child, element));

	// 5. Append the element node to the parent element.
	parentEl.append(element);
}

/**
 * Add the attributes and event listeners to the element node,
 * saving the added event listeners in a new property of the virtual node, called listeners.
 *
 * @param {Element} el the HTMLElement created by createElement method.
 * @param {Object} props the one contains the attributes and event listeners, like `class`,
 *                       `style`, `on`.
 * @param {Object} vdom the virtual DOM node of type "element"
 */
function addProps(el, props, vdom) {
	// Get all event listeners and other attributes.
	const { on: events, ...attrs } = props;
	// Add event listeners to the element node.
	vdom.listeners = addEventListeners(events, el);
	// Add the attributes to the element node.
	setAttributes(el, attrs);
}
