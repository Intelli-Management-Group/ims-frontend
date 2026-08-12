import { describe, expect, it } from 'vitest';
import { dropAtIndex } from './form-elements-helpers';

describe('dropAtIndex', () => {
  it('removes the element at the given index', () => {
    const arr = ['a', 'b', 'c'];
    expect(dropAtIndex(arr, 1)).toEqual(['a', 'c']);
  });

  it('returns a new array and does not mutate the original', () => {
    const arr = [1, 2, 3];
    const result = dropAtIndex(arr, 0);
    expect(result).toEqual([2, 3]);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('returns a shallow copy when dropping the only element', () => {
    const arr = ['only'];
    expect(dropAtIndex(arr, 0)).toEqual([]);
  });

  it('returns an empty array unchanged when index is 0', () => {
    expect(dropAtIndex([], 0)).toEqual([]);
  });
});
