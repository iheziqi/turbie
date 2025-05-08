import { DOM_TYPES } from './h';

/**
 * Checks if the given two DOM node are of the same type.
 * @param {import('./h').VNode} nodeOne
 * @param {import('./h').VNode} nodeTwo
 * @returns {boolean}
 */
export function areNodesEqual(nodeOne, nodeTwo) {
	// Nodes of different types are never equal.
	if (nodeOne.type !== nodeTwo.type) {
		return false;
	}

	// Element nodes require their tag name to be the same.
	if (nodeOne.type === DOM_TYPES.ELEMENT) {
		const {
			tag: tagOne,
			props: { key: keyOne },
		} = nodeOne;
		const {
			tag: tagTwo,
			props: { key: keyTwo },
		} = nodeTwo;

		return tagOne === tagTwo && keyOne === keyTwo;
	}

	// Compares the two component prototypes when the type is component
	if (nodeOne.type === DOM_TYPES.COMPONENT) {
		const {
			tag: componentOne,
			props: { key: keyOne },
		} = nodeOne;
		const {
			tag: componentTwo,
			props: { key: keyTwo },
		} = nodeTwo;

		return componentOne === componentTwo && keyOne === keyTwo;
	}

	return true;
}
