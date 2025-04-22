import { DOM_TYPES } from './h';

/**
 * Checks if the given two DOM node are of the same type.
 * @param {object} nodeOne
 * @param {object} nodeTwo
 * @returns {boolean}
 */
export function areNodesEqual(nodeOne, nodeTwo) {
	// Nodes of different types are never equal.
	if (nodeOne.type !== nodeTwo.type) {
		return false;
	}

	// Element nodes require their tag name to be the same.
	if (nodeOne.type === DOM_TYPES.ELEMENT) {
		const { tag: tagOne } = nodeOne;
		const { tag: tagTwo } = nodeTwo;

		return tagOne === tagTwo;
	}

	return true;
}
