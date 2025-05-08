import { DOM_TYPES } from './h';
import { addEventListeners } from './events';
import { setAttributes } from './attributes';
import { extractPropsAndEvents } from './utils/props';

/**
 * Inserts an element into the given parent element at the given index.
 * @param {HTMLElement} el
 * @param {HTMLElement} parentEl
 * @param {number} index
 */
function insert(el, parentEl, index) {
	// If index is null or undefined, simply append.
	// Note the usage of == instead of ===.
	if (index == null) {
		parentEl.append(el);
		return;
	}

	if (index < 0) {
		throw new Error(`Index must be a positive integer, but got ${index}`);
	}

	const children = parentEl.childNodes;

	if (index >= children.length) {
		// if the index is greater than the children length, just append it.
		parentEl.append(el);
	} else {
		// otherwise node is inserted at the given index.
		parentEl.insertBefore(el, children[index]);
	}
}

/**
 * Creates the DOM nodes for a virtual DOM tree, mounts them in the DOM, and
 * modifies the vdom tree to include the corresponding DOM nodes and event listeners.
 *
 * @param {Object} vdom the virtual DOM node to mount
 * @param {HTMLElement} parentEl the host element to mount the virtual DOM node to
 * @param {number} index the index at which the node is inserted into the parent element.
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 */
export function mountDOM(vdom, parentEl, index, hostComponent = null) {
	switch (vdom.type) {
		case DOM_TYPES.TEXT:
			createTextNode(vdom, parentEl, index);
			break;
		case DOM_TYPES.ELEMENT:
			createElementNode(vdom, parentEl, index, hostComponent);
			break;
		case DOM_TYPES.FRAGMENT:
			createFragmentNodes(vdom, parentEl, index, hostComponent);
			break;
		case DOM_TYPES.COMPONENT:
			createComponentNode(vdom, parentEl, index, hostComponent);
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
 * @param {HTMLElement} parentEl the host element to mount the virtual DOM node to
 * @param {number} index
 */
function createTextNode(vdom, parentEl, index) {
	const { value } = vdom;

	const textNode = document.createTextNode(value);
	// el saves a reference to the real DOM node in the virtual node.
	// This reference is used by the reconciliation algorithm.
	vdom.el = textNode;

	insert(textNode, parentEl, index);
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
 * @param {HTMLElement} parentEl the host element to mount the virtual DOM node to
 * @param {number} index
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 */
function createFragmentNodes(vdom, parentEl, index, hostComponent) {
	const { children } = vdom;
	// el saves a reference to the real DOM node in the virtual node.
	// This reference is used by the reconciliation algorithm.
	vdom.el = parentEl;

	children.forEach((child, i) =>
		mountDOM(child, parentEl, index ? index + i : null, hostComponent)
	);
}

/**
 * Creates the component node, and all of its subcomponents recursively.
 *
 * The created `Component` is added to the `component` property of the vdom.
 * The created `Element` is added to the `el` property of the vdom. If the component
 * has a fragment, and thus several top-level elements, the first one is added to the `el`.
 *
 * The use case for the `el` reference is the reconciliation algorithm. In the case of
 * a component, it's sole use is to move a component to a different position using the
 * `insertBefore()` method. To insert an element before a component, the `el` property
 * points at the component's first element.
 *
 * @param {import('./h').ComponentVNode} vdom the virtual DOM node of type "fragment"
 * @param {Element} parentEl the host element to mount the virtual DOM node to
 * @param {number} [index] the index at the parent element to mount the virtual DOM node to
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 */
function createComponentNode(vdom, parentEl, index, hostComponent) {
	const Component = vdom.tag;
	const { props, events } = extractPropsAndEvents(vdom);
	const component = new Component(props, events, hostComponent);

	component.mount(parentEl, index);
	vdom.component = component;
	vdom.el = component.firstElement;
}

/**
 * Creates the HTML element for a virtual DOM element node and its children recursively.
 * The created `Element` is added to the `el` property of the vdom.
 *
 * If the vdom includes event listeners, these are added to the vdom object, under the
 * `listeners` property.
 *
 * @param {Object} vdom the virtual DOM node of type "element"
 * @param {HTMLElement} parentEl the host element to mount the virtual DOM node to
 * @param {number} index
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 */
function createElementNode(vdom, parentEl, index, hostComponent) {
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
	addProps(element, props, vdom, hostComponent);

	// 3. Save a reference to the element node in the virtual node.
	vdom.el = element;

	// 4. Mount the children, recursively, into the element node
	children.forEach((child) => mountDOM(child, element, null, hostComponent));

	// 5. Insert the element node to the parent element.
	insert(element, parentEl, index);
}

/**
 * Add the attributes and event listeners to the element node,
 * saving the added event listeners in a new property of the virtual node, called listeners.
 *
 * @param {Element} el the HTMLElement created by createElement method.
 * @param {Object} props the one contains the attributes and event listeners, like `class`,
 *                       `style`, `on`.
 * @param {Object} vdom the virtual DOM node of type "element"
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 */
function addProps(el, props, vdom, hostComponent) {
	// Get all event listeners and other attributes.
	const { on: events, ...attrs } = props;
	// Add event listeners to the element node.
	vdom.listeners = addEventListeners(events, el, hostComponent);
	// Add the attributes to the element node.
	setAttributes(el, attrs);
}
