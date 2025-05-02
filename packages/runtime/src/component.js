import { mountDOM } from './mount-dom';
import { destroyDOM } from './destroy-dom';
import { patchDOM } from './patch-dom';
import { DOM_TYPES, extractChildren } from './h';

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

export function defineComponent({ render, state }) {
	class Component {
		#isMounted = false;
		/**
		 * @type {import('./h').VNode}
		 */
		#vdom = null;
		#hostEl = null;

		constructor(props) {
			this.props = props;
			this.state = state ? state(props) : {};
		}

		get elements() {
			if (this.#vdom == null) {
				return [];
			}

			// If the vdom top node is a fragment, returns the elements inside the fragment
			if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
				return extractChildren(this.#vdom).map((child) => child.el);
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
			mountDOM(this.#vdom, hostEl, index);

			this.#hostEl = hostEl;
			this.#isMounted = true;
		}

		unmount() {
			if (!this.#isMounted) {
				throw new Error('Component is not mounted yet!');
			}
			destroyDOM(this.#vdom);

			this.#vdom = null;
			this.#hostEl = null;
			this.mountDOM = false;
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

	return Component;
}
