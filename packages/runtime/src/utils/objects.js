/**
 * Diffing two objects.
 * @param {object} oldObj
 * @param {object} newObj
 * @returns {{added: any[], removed: any[], updated: any[]}}
 */
export function objectsDiff(oldObj, newObj) {
	const oldKeys = Object.keys(oldObj);
	const newKeys = Object.keys(newObj);

	return {
		added: newKeys.filter((key) => !(key in oldObj)),
		removed: oldKeys.filter((key) => !(key in newObj)),
		updated: newKeys.filter(
			(key) => key in oldObj && oldObj[key] !== newObj[key]
		),
	};
}

/**
 * Safely evaluate `hasOwnProperty` calls.
 * @link https://eslint.org/docs/latest/rules/no-prototype-builtins
 * */
export function hasOwnProperty(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}
