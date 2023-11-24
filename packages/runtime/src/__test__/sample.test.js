import { describe, expect, it } from 'vitest';
import { h } from '../h';

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
});
