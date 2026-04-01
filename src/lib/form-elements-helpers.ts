/**
 * Removes an element from an array at the specified index.
 */
export const dropAtIndex = <T>(array: T[], index: number): T[] => {
	return array.filter((_, i) => i !== index);
};

/**
 * Inserts an element at a specified index in a list and returns a new list.
 */
export const insertAtIndex = <T>(list: T[], element: T, index: number) => [
	...list.slice(0, index),
	element,
	...list.slice(index),
];
