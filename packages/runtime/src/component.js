import { mountDOM } from './mount-dom';
import { destroyDOM } from './destroy-dom';
import { patchDOM } from './patch-dom';
import { DOM_TYPES, extractChildren } from './h';
import { hasOwnProperty } from './utils/objects';
import { Dispatcher } from './dispatcher';

/**
 * @typedef Component
 * @type {object}
 * @property {function} mount - Mounts the component into the DOM.
 * @property {function} unmount - Unmounts the component from the DOM.
 * @property {function} patch - Updates the component's virtual DOM tree and patches the DOM to reflect the changes.
 * @property {function} updateProps - Updates all or part of the component's props.
 * @property {function} updateState - Updates all or part of the component's state and patches the DOM.
 */

/**
 * @typedef DefineComponentArgs
 * @type {object}
 * @property {function} render - The component's render function returning the virtual DOM tree representing the component in its current state.
 * @property {(props: Object?) => Object} state - The component's state function returning the component's initial state.
 * @property {Object<string, Function>} methods - The component's methods.
 */

/**
 * Defines a component that can be instantiated and mounted into the DOM.
 *
 * @param {DefineComponentArgs} definitionArguments
 * @returns {Component}
 */

export function defineComponent({ render, state, ...methods }) {
	class Component {
		#isMounted = false;
		/**
		 * @type {import('./h').VNode}
		 */
		#vdom = null;
		#hostEl = null;
		#eventHandlers = null;
		#parentComponent = null;
		#dispatcher = new Dispatcher();
		#subscriptions = [];

		constructor(props = {}, eventHandler = {}, parentComponent = null) {
			this.props = props;
			this.state = state ? state(props) : {};
			this.#eventHandlers = eventHandler;
			this.#parentComponent = parentComponent;
		}

		get elements() {
			if (this.#vdom == null) {
				return [];
			}

			// If the vdom top node is a component, returns the elements inside the component
			if (this.#vdom.type === DOM_TYPES.COMPONENT) {
				return extractChildren(this.#vdom).flatMap((child) => {
					if (child.type === DOM_TYPES.COMPONENT) {
						return child.component.elements;
					}

					return [child.el];
				});
			}

			// If the vdom top node is a single node, returns its element
			return [this.#vdom.el];
		}

		get firstElement() {
			return this.elements[0];
		}

		get offset() {
			if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
				return Array.from(this.#hostEl.children).indexOf(this.firstElement);
			}

			return 0;
		}

		updateState(state) {
			this.state = { ...this.state, ...state };
			this.#patch();
		}

		updateProps(props) {
			this.props = { ...this.props, ...props };
			this.#patch;
		}

		render() {
			// Since the render function is passed from outside, it needs to be bound to the component
			// to have access to this.state and other component variables.
			return render.call(this);
		}

		mount(hostEl, index = null) {
			if (this.#isMounted) {
				throw new Error('Component is already mounted!');
			}

			this.#vdom = this.render();
			mountDOM(this.#vdom, hostEl, index, this);
			this.#wireEventHandlers();

			this.#hostEl = hostEl;
			this.#isMounted = true;
		}

		#wireEventHandlers() {
			this.#subscriptions = Object.entries(this.#eventHandlers).map(
				([eventName, handler]) => {
					this.#wireEventHandler(eventName, handler);
				}
			);
		}

		#wireEventHandler(eventName, handler) {
			return this.#dispatcher.subscribe(eventName, (payload) => {
				if (this.#parentComponent) {
					// If there is a parent component, binds the event handler's context to it and calls it
					// You need to bind the event handler's context to the parent component instance because
					// the event handler is defined in the parent component, and you want to call it with the parent component instance as its context.
					handler.call(this.#parentComponent, payload);
				} else {
					handler(payload);
				}
			});
		}

		unmount() {
			if (!this.#isMounted) {
				throw new Error('Component is not mounted yet!');
			}
			destroyDOM(this.#vdom);
			this.#subscriptions.forEach((unsubscribe) => unsubscribe());

			this.#vdom = null;
			this.#hostEl = null;
			this.mountDOM = false;
			this.#subscriptions = [];
		}

		/**
		 * Emits an event to the parent component.
		 *
		 * @param {string} eventName The name of the event to emit
		 * @param {Any} [payload] The payload to pass to the event handler
		 */
		emit(eventName, payload) {
			this.#dispatcher.dispatch(eventName, payload);
		}

		#patch() {
			if (!this.#isMounted) {
				throw new Error('Component is not mounted!');
			}

			const vdom = this.render();
			// To use the component's offset here, the component instance "this" is needed to be passed
			this.#vdom = patchDOM(this.#vdom, vdom, this.#hostEl, this);
		}
	}

	for (const methodName in methods) {
		if (hasOwnProperty(Component, methodName)) {
			throw new Error(
				`Method "${methodName}()" already exists in the component.`
			);
		}

		Component.prototype[methodName] = methods[methodName];
	}

	return Component;
}
