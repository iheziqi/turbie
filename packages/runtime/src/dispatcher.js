/**
 * @typedef {Map<string, Function[]>} CommandHandlersMap
 */

export class Dispatcher {
	/**
	 * @private
	 * @type {CommandHandlersMap}
	 */
	#subs = new Map();

	#afterHandlers = [];

	/**
	 * Registers an handler function that executes in response to a specific command
	 * being dispatched and returns a function that un-registers the handler.
	 *
	 * @param {string} commandName the name of the command to register the handler for
	 * @param {(any) => void} handler the handler of the command
	 * @returns {() => void} a function that un-registers the handler
	 */
	subscribe(commandName, handler) {
		// Checks if there is an entry in subs for that command name.
		// Creates one with an empty array if there isn't.
		if (!this.#subs.has(commandName)) {
			this.#subs.set(commandName, []);
		}

		// If the handler was already registered, simply returns a function that does nothing.
		const handlers = this.#subs.get(commandName);
		if (handlers.includes(handler)) {
			return () => {};
		}

		// Appends the handler to the array in case it wasn't already registered.
		handlers.push(handler);

		// If the handler function was registered, the subscribe() method returns a function
		// that removes the handler from teh corresponding array of handlers.
		// The function here is a closure that captures the handlers array and handler argument.
		// When invoked, it finds the index of the handler in the array and removes it.
		return () => {
			const idx = handlers.indexOf(handler);
			handlers.splice(idx, 1);
		};
	}

	/**
	 * Registers a handler function that runs after each command and returns a
	 * function that un-registers the handler.
	 *
	 * @param {() => void} handler a function that runs after each command
	 * @returns {() => void} a function that un-registers the handler
	 */
	afterEveryCommand(handler) {
		this.#afterHandlers.push(handler);

		return () => {
			const idx = this.#afterHandlers.indexOf(handler);
			this.#afterHandlers.splice(idx, 1);
		};
	}

	/**
	 * Dispatches a command to all registered handlers and runs all
	 * handlers registered to run after each command.
	 *
	 * Displays a warning if the command has no handlers registered.
	 *
	 * @param {string} commandName the name of the command to dispatch
	 * @param {any} payload the payload of the command
	 */
	dispatch(commandName, payload) {
		if (this.#subs.has(commandName)) {
			const handlers = this.#subs.get(commandName);
			handlers.forEach((handler) => handler(payload));
		} else {
			console.warn(`No handler for command ${commandName}`);
		}

		this.#afterHandlers.forEach((handler) => handler());
	}
}
