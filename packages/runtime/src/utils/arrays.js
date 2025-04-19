/**
 * Filter out null and undefined in the array.
 * @param {Array} arr - The input array containing elements, including null values.
 * @returns {Array} The new array with null and undefined values removed.
 */
export function withoutNulls(arr) {
	// Use != instead of !==, this is how we can remove both null and undefined values.
	return arr.filter((item) => item != null);
}

/**
 * Diffing two arrays.
 * To keep the code simple, the order difference of an items in the array is ignored.
 * It might cause problem because if this diffing is used on array of style class,
 * the order matters because a class comes later may overwrite the style of the
 * classList comes earlier. This is the tradeoff made to keep the code simple.
 * @param {Array} oldArray
 * @param {Array} newArray
 * @returns
 */
export function arraysDiff(oldArray, newArray) {
	return {
		added: newArray.filter((newItem) => !oldArray.includes(newItem)),
		removed: oldArray.filter((oldItem) => !newArray.includes(oldItem)),
	};
}
