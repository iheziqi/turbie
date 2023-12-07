import { it, expect, describe, vitest } from 'vitest';
import { Dispatcher } from '../dispatcher';

describe('dispatcher test', () => {
	it('should dispatch a greeting command', () => {
		const logSpy = vitest.spyOn(global.console, 'log');
		const myDispatcher = new Dispatcher();

		myDispatcher.subscribe('greet', (name) => {
			console.log(`Hello, ${name}!`);
		});

		myDispatcher.afterEveryCommand(() => {
			console.log('Done greeting!');
		});

		myDispatcher.dispatch('greet', 'John');

		expect(logSpy).toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy).toHaveBeenCalledWith('Hello, John!');
		expect(logSpy).toHaveBeenCalledWith('Done greeting!');
	});
});
