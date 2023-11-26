import { describe, expect, it } from 'vitest';
import { DOM_TYPES, h, hFragment } from '../h';

describe('testing the virtual DOM functions', () => {
	it('should create a single virtual DOM node representation', () => {
		const p = h('p', { class: 'random-paragraph' }, ['hello']);

		expect(p).toHaveProperty('tag');
		expect(p).toHaveProperty('props');
		expect(p).toHaveProperty('children');
		// The children property should be an array.
		expect(p.children).toBeTypeOf('object');
		expect(p.children[0]).toEqual({ type: 'text', value: 'hello' });
	});

	it('should create complex virtual DOM node representation', () => {
		// Create elements inside the form.
		const input1 = h('input', { type: 'text', name: 'user' });
		const input2 = h('input', { type: 'password', name: 'pass' });
		const login = () => console.log('clicked!');
		const button = h('button', { on: { click: login } }, ['Login']);

		// Create form element.
		const loginForm = h('form', { class: 'login-form', action: 'login' }, [
			input1,
			input2,
			button,
		]);

		// The output should be an object.
		expect(loginForm).toBeTypeOf('object');
		// The tag should be 'form'.
		expect(loginForm.tag).toBe('form');
		// The props should be {class: 'login-form', action: 'login'}
		expect(loginForm.props).toEqual({ class: 'login-form', action: 'login' });
		// The number of children should be 3.
		expect(loginForm.children.length).toBe(3);
	});

	it('should create complex virtual DOM node representation 2', () => {
		const title = h('h1', { class: 'title' }, ['My counter']);
		const container = h('div', { class: 'container' }, [
			h('button', {}, ['decrement']),
			h('span', {}, ['0']),
			h('button', {}, ['increment']),
		]);
		const fragment = hFragment([title, container]);

		// The output should be an fragment object
		expect(fragment).toBeTypeOf('object');
		expect(fragment.type).toBe('fragment');
		expect(fragment.children.length).toBe(2);
	});

	it('should returns a virtual DOM consisting of a fragment with as many paragraphs as the number passed to the function', () => {
		function lipsum(n) {
			const text =
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
			return hFragment(Array(n).fill(h('p', {}, [text])));
		}

		const lipsum3 = lipsum(3);
		expect(lipsum3).toBeTypeOf('object');
		expect(lipsum3.type).toBe('fragment');
		expect(lipsum3.children.length).toBe(3);
	});

	it('should correctly implement MessageComponent() function', () => {
		/**
		 * Produces a virtual DOM that represents a message box.
		 * @param {String} level - a string that can be either 'info', 'warning', or 'error'.
		 * @param {String} message - a string with the message to display.
		 */
		function MessageComponent(level, message) {
			return h('div', { class: `message message-${level}` }, [
				h('p', {}, [message]),
			]);
		}

		const messageComponent = MessageComponent(
			'info',
			'This is an info message'
		);
		expect(messageComponent).toBeTypeOf('object');
		expect(messageComponent.type).toBe(DOM_TYPES.ELEMENT);
		expect(messageComponent.props).toEqual({ class: 'message message-info' });
		expect(messageComponent.children.length).toBe(1);
	});
});
