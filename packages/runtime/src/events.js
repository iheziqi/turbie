/**
 * Adds an event listener to an event target and returns the listener.
 *
 * @param {string} eventName the name of the event to listen to
 * @param {(event: Event) => void} handler the event handler
 * @param {EventTarget} el the element to add the event listener to
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 * @returns {(event: Event) => void} the event handler
 */
export function addEventListener(eventName, handler, el, hostComponent = null) {
	// el.addEventListener(eventName, handler);

	function boundHandler() {
		// If a host component exists, binds it to the event handler context
		hostComponent
			? handler.apply(hostComponent, arguments)
			: handler(...arguments);
	}

	el.addEventListener(eventName, boundHandler);

	return boundHandler;
}

/**
 * Adds event listeners to an event target and returns an object containing
 * the added listeners.
 *
 * @param {object} listeners The event listeners to add
 * @param {EventTarget} el The element to add the listeners to
 * @param {import('./component').Component} [hostComponent] The component that the listeners are added to
 * @returns {object} The added listeners
 */
export function addEventListeners(listeners = {}, el, hostComponent = null) {
	const addedListeners = {};

	Object.entries(listeners).forEach(([eventName, handler]) => {
		const listener = addEventListener(eventName, handler, el, hostComponent);
		addedListeners[eventName] = listener;
	});

	return addedListeners;
}

/**
 * Removes the event listeners from an event target.
 *
 * @param {Object} listeners the event listeners to remove
 * @param {EventTarget} el the element to remove the event listeners from
 */
export function removeEventListeners(listeners = {}, el) {
	Object.entries(listeners).forEach(([eventName, handler]) => {
		// The event listener to be removed is identified using a combination
		// of the event type, the event listener function itself.
		el.removeEventListener(eventName, handler);
	});
}
