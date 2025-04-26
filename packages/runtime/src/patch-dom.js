import { destroyDOM } from './destroy-dom';
import { mountDOM } from './mount-dom';
import { areNodesEqual } from './nodes-equal';
import { DOM_TYPES, extractChildren } from './h';
import {
	setAttribute,
	removeAttribute,
	removeStyle,
	setStyle,
} from './attributes';
import { objectsDiff } from './utils/objects';
import { isNotBlankOrEmptyString } from './utils/strings';
import { ARRAY_DIFF_OP, arraysDiff, arraysDiffSequence } from './utils/arrays';
import { addEventListener } from './events';

export function patchDOM(oldVdom, newVdom, parentEl) {
	if (!areNodesEqual(oldVdom, newVdom)) {
		const index = findIndexInParent(parentEl, oldVdom.el);
		destroyDOM(oldVdom);
		mountDOM(newVdom, parentEl, index);
		return newVdom;
	}

	// saves the reference to the DOM element in the new virtual node.
	newVdom.el = oldVdom.el;

	switch (newVdom.type) {
		case DOM_TYPES.TEXT: {
			patchText(oldVdom, newVdom);
			return newVdom;
		}
		case DOM_TYPES.ELEMENT: {
			patchElement(oldVdom, newVdom);
			break;
		}
	}

	patchChildren(oldVdom, newVdom);

	return newVdom;
}

/**
 * Finds the index of a child element in its parent element.
 * @param {HTMLElement} parentEl
 * @param {HTMLElement} el
 * @returns {number | null}
 */
function findIndexInParent(parentEl, el) {
	const index = Array.from(parentEl.childNodes).indexOf(el);
	if (index < 0) {
		return null;
	}
	return index;
}

/**
 * Patches the text node if the text content is different.
 * @param {object} oldVdom
 * @param {object} newVdom
 */
function patchText(oldVdom, newVdom) {
	const el = oldVdom.el;
	const { value: oldText } = oldVdom;
	const { value: newText } = newVdom;
	if (oldText !== newText) {
		el.nodeValue = newText;
	}
}

function patchElement(oldVdom, newVdom) {
	const el = oldVdom.el;
	const {
		class: oldClass,
		style: oldStyle,
		on: oldEvents,
		...oldAttrs
	} = oldVdom.props;
	const {
		class: newClass,
		style: newStyle,
		on: newEvents,
		...newAttrs
	} = newVdom.props;

	const { listeners: oldListeners } = oldVdom;

	patchAttrs(el, oldAttrs, newAttrs);
	patchClasses(el, oldClass, newClass);
	patchStyles(el, oldStyle, newStyle);

	newVdom.listeners = patchEvents(el, oldListeners, oldEvents, newEvents);
}

/**
 * Patches attributes of a dom element.
 *
 * The attributes of a virtual node are all the key-value pairs that come inside its props object
 * — except the class, style, and on properties, which have a special meaning.
 * @param {HTMLElement} el
 * @param {object} oldAttrs
 * @param {object} newAttrs
 */
function patchAttrs(el, oldAttrs, newAttrs) {
	const { added, removed, updated } = objectsDiff(oldAttrs, newAttrs);

	for (const attr of removed) {
		removeAttribute(el, attr);
	}

	for (const attr of added.concat(updated)) {
		setAttribute(el, attr, newAttrs[attr]);
	}
}

/**
 * Patches CSS classes.
 * In the Vdom definition, CSS class can come as a string ('foo bar') or as an array of strings (['foo', 'bar']).
 * @param {HTMLElement} el
 * @param {string | string[]} oldClass
 * @param {string | string[]} newClass
 */
function patchClasses(el, oldClass, newClass) {
	// first convert both old and new CSS classes to arrays
	const oldClasses = toClassList(oldClass);
	const newClasses = toClassList(newClass);

	// then use arraysDiff to find what classes have been removed or added
	const { added, removed } = arraysDiff(oldClasses, newClasses);

	if (removed.length > 0) {
		el.classList.remove(...removed);
	}

	if (added.length > 0) {
		el.classList.add(...added);
	}
}

/**
 * Convert class list or class array to an array of classes.
 * @param {string | string[]} classes
 * @returns
 */
function toClassList(classes = '') {
	return Array.isArray(classes)
		? classes.filter(isNotBlankOrEmptyString) // filter out blank and empty ones
		: classes.split(/(\s+)/).filter(isNotBlankOrEmptyString); // split it on white space then do the same
}

/**
 * Patches styles.
 *
 * Styles are a object in Vdom.
 * @param {HTMLElement} el
 * @param {object} oldStyle
 * @param {object} newStyle
 */
function patchStyles(el, oldStyle = {}, newStyle = {}) {
	const { added, removed, updated } = objectsDiff(oldStyle, newStyle);

	for (const style of removed) {
		removeStyle(el, style);
	}

	for (const style of added.concat(updated)) {
		setStyle(el, style);
	}
}

/**
 * Patches events that have been updated to a DOM element.
 * @param {HTMLElement} el
 * @param {object} oldListeners The event listeners that have been attached to the DOM element.
 * @param {object} oldEvents
 * @param {object} newEvents
 * @returns {object} added event listeners
 */
function patchEvents(el, oldListeners = {}, oldEvents = {}, newEvents = {}) {
	const { removed, added, updated } = objectsDiff(oldEvents, newEvents);

	// removes what have been removed or modified event listeners
	for (const eventName of removed.concat(updated)) {
		el.removeEventListener(eventName, oldListeners[eventName]);
	}

	const addedEventListeners = {};

	for (const eventName of added.concat(updated)) {
		const listener = addEventListener(eventName, newEvents[eventName], el);
		addEventListener[eventName] = listener;
	}

	return addedEventListeners;
}

function patchChildren(oldVdom, newVdom) {
	const oldChildren = extractChildren(oldVdom);
	const newChildren = extractChildren(newVdom);

	const parentEl = oldVdom.el;

	// finds the operations that transform the old children to new children
	// uses areNodesEqual as the equalsFn to check if two nodes are the same
	const diffSeq = arraysDiffSequence(oldChildren, newChildren, areNodesEqual);

	for (const operation of diffSeq) {
		const { originalIndex, index, item } = operation;

		switch (operation.op) {
			case ARRAY_DIFF_OP.ADD: {
				// When a new node is added to the children array,
				// it’s like mounting a subtree of the DOM at a specific place.
				mountDOM(item, parentEl, index);
				break;
			}
			case ARRAY_DIFF_OP.REMOVE: {
				destroyDOM(item);
				break;
			}
			case ARRAY_DIFF_OP.NOOP: {
				// Gets the old virtual node at the original index
				const oldChild = oldChildren[originalIndex];
				// Gets the new virtual node at the new index
				const newChild = newChildren[index];
				// Gets the DOM element associated with the moved node
				const el = oldChild.el;
				// Finds the element at the target index inside the parent element
				const elAtTargetIndex = parentEl.childNodes[index];

				// Inserts the moved element before the target element
				parentEl.insertBefore(el, elAtTargetIndex);
				// Recursively patches the moved element
				patchDOM(oldChild, newChild, parentEl);
				break;
			}
			case ARRAY_DIFF_OP.MOVE: {
				patchDOM(oldChildren[originalIndex], newChildren[index], parentEl);
				break;
			}
		}
	}
}
