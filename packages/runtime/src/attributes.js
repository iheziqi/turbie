/**
 * Sets the attributes of an element.
 *
 * It doesn't remove attributes that are not present in the new attributes,
 * except in the case of the `class` attribute.
 *
 * @param {HTMLElement} el target element
 * @param {Object} attrs attributes to set
 */
export function setAttributes(el, attrs) {
	// Destructure the attrs property and aliases the class attribute to the className,
	// as class is a reserved word in JS.
	const { class: className, style, ...otherAttrs } = attrs;

	if (className) {
		setClass(el, className);
	}

	if (style) {
		Object.entries(style).forEach(([prop, value]) => {
			setStyle(el, prop, value);
		});
	}

	for (const [name, value] of Object.entries(otherAttrs)) {
		setAttribute(el, name, value);
	}
}

/**
 * Sets the class attribute of the node.
 * @param {HTMLElement} el
 * @param {Array<string>|String} className the class attribute either as a string or as an array of string,
 */
function setClass(el, className) {
	// Both should work:
	// {
	// 	type: DOM_TYPES.ELEMENT,
	// 	tag: 'div',
	// 	props: {
	// 		class: ['foo', 'bar', 'baz'],
	// 	},
	// };

	// {
	// 	type: DOM_TYPES.ELEMENT,
	// 	tag: 'div',
	// 	props: {
	// 		class: 'foo, bar, baz',
	// 	},
	// };
	el.className = '';

	if (typeof className === 'string') {
		el.className = className;
	}

	// div.classList.add('foo', 'bar', 'baz') -> <div class="foo bar baz"></div>
	if (Array.isArray(className)) {
		el.classList.add(...className);
	}
}

/**
 * Sets the attribute on the element.
 *
 * @param {Element} el The element to add the attribute to
 * @param {String} name The name of the attribute
 * @param {(String|Number|Null)} value The value of the attribute
 */
export function setAttribute(el, name, value) {
	if (value == null) {
		removeAttribute(el, name);
	} else if (name.startsWith('data-')) {
		// If the attribute is the data-* custom data attributes
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
		el.setAttribute(name, value);
	} else {
		// Other attributes like 'ariaXXX', 'id', 'innerHTML' ... can be set using JS object notation.
		el[name] = value;
	}
}

/**
 * Removes the attribute from the element.
 *
 * @param {Element} el the element where the attribute is set
 * @param {String} name name of the attribute
 */
export function removeAttribute(el, name) {
	el[name] = null;
	// The Element method removeAttribute() removes the attribute
	// with the specified name from the element.
	el.removeAttribute(name);
}

export function setStyle(el, name, value) {
	el.style[name] = value;
}

export function removeStyle(el, name) {
	el.style[name] = null;
}
