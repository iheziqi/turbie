/**
 * Checks if a string is empty.
 * @param {string} str
 * @returns {boolean}
 */
export function isNotEmptyString(str) {
	return str !== '';
}

/**
 * Checks if a string is not blank nor empty.
 * @param {string} str
 * @returns {boolean}
 */
export function isNotBlankOrEmptyString(str) {
	return isNotEmptyString(str.trim());
}
