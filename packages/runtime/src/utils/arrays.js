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

export const ARRAY_DIFF_OP = {
	ADD: 'add',
	REMOVE: 'remove',
	MOVE: 'move',
	NOOP: 'noop', // no operation
};

class ArrayWithOriginalIndices {
	/**
	 * A copy of the original array.
	 */
	#array = [];

	/**
	 * Keep track of the original indices.
	 */
	#originalIndices = [];

	/**
	 * Save the function used to compare two items in the array.
	 */
	#equalsFn;

	constructor(array, equalsFn) {
		this.#array = [...array];
		this.#originalIndices = array.map((_, i) => i);
		this.#equalsFn = equalsFn;
	}

	get length() {
		return this.#array.length;
	}

	/**
	 * Checks wether the item in original array has been removed in the new array.
	 * @param {number} index
	 * @param {any[]} newArray
	 * @returns
	 */
	isRemoval(index, newArray) {
		// if the index is out of bounds, there's nothing to remove.
		if (index >= this.length) return false;

		const item = this.#array[index];
		const indexInNewArray = newArray.findIndex((newItem) =>
			this.#equalsFn(item, newItem)
		);

		// if the index returned from findIndex is -1, the item was removed.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
		return indexInNewArray === -1;
	}

	removeItem(index) {
		const operation = {
			op: ARRAY_DIFF_OP.REMOVE,
			index,
			item: this.#array[index],
		};

		this.#array.splice(index, 1);
		// also removes the the original index of the item, which is kept in the array originalIndices
		this.#originalIndices.splice(index, 1);

		return operation;
	}

	isNoop(index, newArray) {
		if (index >= newArray.length) return false;

		const item = this.#array[index];
		const newItem = newArray[index];

		return this.#equalsFn(item, newItem);
	}

	/**
	 * Returns the original index of item in the old array.
	 * @param {number} index
	 * @returns {number}
	 */
	originalIndexAt(index) {
		return this.#originalIndices[index];
	}

	noopItem(index) {
		return {
			op: ARRAY_DIFF_OP.NOOP,
			originalIndex: this.originalIndexAt(index),
			index,
			item: this.#array[index],
		};
	}

	/**
	 * Checks if an given item exists in the array from the given index.
	 * @param {any} item
	 * @param {number} fromIndex
	 * @returns {number}
	 */
	findIndexFrom(item, fromIndex) {
		for (let i = fromIndex; i < this.length; i++) {
			if (this.#equalsFn(item, this.#array[i])) {
				return i;
			}
		}

		return -1;
	}

	isAddition(item, fromIdx) {
		return this.findIndexFrom(item, fromIdx) === -1;
	}

	addItem(item, index) {
		const operation = {
			op: ARRAY_DIFF_OP.ADD,
			index,
			item,
		};

		this.#array.splice(index, 0, item);
		// the added item wasn't present in the original array, so use -1 in this case.
		this.#originalIndices.splice(index, 0, -1);

		return operation;
	}

	moveItem(item, toIndex) {
		// first finds where it was in the original array.
		const fromIndex = this.findIndexFrom(item, toIndex);
		const operation = {
			op: ARRAY_DIFF_OP.MOVE,
			originalIndex: this.originalIndexAt(fromIndex),
			from: fromIndex, // index in the original array
			index: toIndex, // index in the new array
			item: this.#array[fromIndex],
		};

		// extracts the item from the old array
		const [_item] = this.#array.splice(fromIndex, 1);
		// inserts the item into the new position
		this.#array.splice(toIndex, 0, _item);

		// do the same for the indices array
		const [originalIndex] = this.#originalIndices.splice(fromIndex, 1);
		this.#originalIndices.splice(toIndex, 0, originalIndex);

		return operation;
	}

	removeItemsAfter(index) {
		const operations = [];

		while (this.length > index) {
			operations.push(this.removeItem(index));
		}

		return operations;
	}
}

/**
 * Computes the sequence of operations needed to transform oldArray into newArray.
 * The sequence consists of removal, addition, movement, and no-operations.
 * This function is used to find the differences between virtual DOM children.
 *
 * @param {Array} oldArray - The original array to transform from
 * @param {Array} newArray - The target array to transform to
 * @param {Function} [equalsFn=(a, b) => a === b] - Custom equality function to compare array elements
 * @returns {Array} An array of operations representing the transformation sequence
 *
 * @example
 * const oldArray = [1, 2, 3];
 * const newArray = [2, 3, 4];
 * const sequence = arraysDiffSequence(oldArray, newArray);
 * // Returns sequence of operations (removal, addition, movement) to transform oldArray into newArray
 */
export function arraysDiffSequence(
	oldArray,
	newArray,
	equalsFn = (a, b) => a === b
) {
	const sequence = [];
	const array = new ArrayWithOriginalIndices(oldArray, equalsFn);

	for (let index = 0; index < newArray.length; index++) {
		if (array.isRemoval(index, newArray)) {
			sequence.push(array.removeItem(index));
			index--; // decrements the index to stay at the same index in the next iteration.
			continue;
		}

		if (array.isNoop(index, newArray)) {
			sequence.push(array.noopItem(index));
			continue;
		}

		const newItem = newArray[index];

		if (array.isAddition(newItem, index)) {
			sequence.push(array.addItem(newItem, index));
			continue;
		}

		sequence.push(array.moveItem(newItem, index));
	}

	sequence.push(...array.removeItemsAfter(newArray.length));

	return sequence;
}

export function applyArraysDiffSequence(oldArray, diffSeq) {
	return diffSeq.reduce((array, { op, item, index, from }) => {
		switch (op) {
			case ARRAY_DIFF_OP.ADD:
				array.splice(index, 0, item);
				break;

			case ARRAY_DIFF_OP.REMOVE:
				array.splice(index, 1);
				break;

			case ARRAY_DIFF_OP.MOVE:
				array.splice(index, 0, array.splice(from, 1)[0]);
				break;
		}

		return array;
	}, oldArray);
}
