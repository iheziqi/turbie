import { DOM_TYPES } from './h';
import { removeEventListeners } from './events';

/**
 * Unmounts the DOM nodes for a virtual DOM tree recursively.
 *
 * Removes all `el` references from the vdom tree and removes all the event
 * listeners from the DOM.
 *
 * @param {Object} vdom the virtual DOM node to destroy
 */
export function destroyDOM(vdom) {
	const { type } = vdom;

	switch (type) {
		case DOM_TYPES.TEXT:
			removeTextNode(vdom);
			break;
		case DOM_TYPES.ELEMENT:
			removeElementNode(vdom);
			break;
		case DOM_TYPES.FRAGMENT:
			removeFragmentNodes(vdom);
			break;
		default:
			throw new Error(`Can't destroy DOM of type: ${type}`);
	}

	delete vdom.el;
}

function removeTextNode(vdom) {
	const { el } = vdom;
	el.remove();
}

function removeElementNode(vdom) {
	const { el, children, listeners } = vdom;

	// The Element.remove() method removes the element from the DOM.
	el.remove();

	// Destroy DOM recursively.
	children.forEach(destroyDOM);

	if (listeners) {
		removeEventListeners(listeners, el);
		// Deletes the listeners property from the virtual node.
		delete vdom.listeners;
	}
}

function removeFragmentNodes(vdom) {
	const { children } = vdom;
	children.forEach(destroyDOM);
}
