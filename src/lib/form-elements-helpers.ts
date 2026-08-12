/**
 * Removes an element from an array at the specified index.
 */
export const dropAtIndex = <T>(array: T[], index: number): T[] => {
	return array.filter((_, i) => i !== index);
};
