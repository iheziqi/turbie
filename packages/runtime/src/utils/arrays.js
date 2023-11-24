/**
 * Filter out null and undefined in the array.
 * @param {Array} arr - The input array containing elements, including null values.
 * @returns {Array} The new array with null and undefined values removed.
 */
export function withoutNulls(arr) {
	// Use != instead of !==, this is how we can remove both null and undefined values.
	return arr.filter((item) => item != null);
}
