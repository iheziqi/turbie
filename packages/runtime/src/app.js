import { destroyDOM } from './destroy-dom';
import { Dispatcher } from './dispatcher';
import { mountDOM } from './mount-dom';

/**
 * Creates an application with the given top-level view, initial state and reducers.
 * A reducer is a function that takes the current state and a payload and returns
 * the new state.
 *
 * @param {object} config the configuration object, containing the view, reducers and initial state
 * @returns {object} the app object
 */
export function createApp({ state, view, reducers = {} }) {
	let parentEl = null;
	let vdom = null;

	// Instance of the Dispatcher
	const dispatcher = new Dispatcher();
	// Subscribes the renderApp() function to be an after-command handler,
	// so that the application is re-rendered after every command is handled.
	const subscriptions = [dispatcher.afterEveryCommand(renderApp)];

	function emit(eventName, payload) {
		dispatcher.dispatch(eventName, payload);
	}

	// Attach reducers
	// Reducer = f(state, payload) => state
	// Reducer is an object which maps command names to reducer functions
	for (const actionName in reducers) {
		const reducer = reducers[actionName];
		const subs = dispatcher.subscribe(actionName, (payload) => {
			// Takes the current state and the command's payload and return a new state
			state = reducer(state, payload);
		});
		subscriptions.push(subs);
	}

	/**
	 * Renders the application, by first destroying the previous DOM —if any— and
	 * then mounting the new view.
	 *
	 * In the next version, a _reconciliation algorithm_ will be used to update the
	 * DOM instead of destroying and mounting the whole view.
	 */
	function renderApp() {
		if (vdom) {
			destroyDOM(vdom);
		}

		vdom = view(state);
		mountDOM(vdom, parentEl);
	}

	return {
		/**
		 * Mounts the application to the given host element.
		 *
		 * @param {Element} _parentEl the host element to mount the virtual DOM node to
		 * @returns {object} the application object
		 */
		mountDOM(_parentEl) {
			parentEl = _parentEl;
			renderApp();
		},

		/**
		 * Unmounts the application from the host element by destroying the associated
		 * DOM and unsubscribing all subscriptions.
		 */
		unmount() {
			destroyDOM(vdom);
			vdom = null;
			subscriptions.forEach((unsubscribe) => unsubscribe());
		},

		/**
		 * Emits an event to the application.
		 *
		 * @param {string} eventName the name of the event to emit
		 * @param {any} payload the payload to pass to the event listeners
		 */
		emit(eventName, payload) {
			emit(eventName, payload);
		},
	};
}
