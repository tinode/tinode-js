import CBuffer from './cbuffer';

describe('CBuffer', () => {
  let buffer;

  beforeEach(() => {
    buffer = new CBuffer((a, b) => a - b, true);
  });

  test('should insert elements in sorted order', () => {
    buffer.put(3, 1, 2);
    expect(buffer.buffer).toEqual([1, 2, 3]);
  });

  test('should insert array elements in sorted order', () => {
    buffer.put([3, 1, 2]);
    expect(buffer.buffer).toEqual([1, 2, 3]);
  });

  test('should get element at given position', () => {
    buffer.put(1, 2, 3);
    expect(buffer.getAt(1)).toBe(2);
  });

  test('should get the last element', () => {
    buffer.put(1, 2, 3);
    expect(buffer.getLast()).toBe(3);
  });

  test('should get the last element with filter', () => {
    buffer.put(1, 2, 3);
    expect(buffer.getLast(x => x < 3)).toBe(2);
  });

  test('should delete element at given position', () => {
    buffer.put(1, 2, 3);
    expect(buffer.delAt(1)).toBe(2);
    expect(buffer.buffer).toEqual([1, 3]);
  });

  test('should delete elements in range', () => {
    buffer.put(1, 2, 3, 4, 5);
    expect(buffer.delRange(1, 4)).toEqual([2, 3, 4]);
    expect(buffer.buffer).toEqual([1, 5]);
  });

  test('should return the length of the buffer', () => {
    buffer.put(1, 2, 3);
    expect(buffer.length()).toBe(3);
  });

  test('should reset the buffer', () => {
    buffer.put(1, 2, 3);
    buffer.reset();
    expect(buffer.buffer).toEqual([]);
  });

  test('should iterate over elements with forEach', () => {
    buffer.put(1, 2, 3);
    const result = [];
    buffer.forEach((elem, prev, next, index) => {
      result.push({
        elem,
        prev,
        next,
        index
      });
    });
    expect(result).toEqual([{
        elem: 1,
        prev: undefined,
        next: 2,
        index: 0
      },
      {
        elem: 2,
        prev: 1,
        next: 3,
        index: 1
      },
      {
        elem: 3,
        prev: 2,
        next: undefined,
        index: 2
      },
    ]);
  });

  test('should find element in buffer', () => {
    buffer.put(1, 2, 3);
    expect(buffer.find(2)).toBe(1);
    expect(buffer.find(4)).toBe(-1);
  });

  test('should filter elements in buffer', () => {
    buffer.put(1, 2, 3, 4, 5);
    buffer.filter(x => x % 2 === 0);
    expect(buffer.buffer).toEqual([2, 4]);
  });

  test('should check if buffer is empty', () => {
    expect(buffer.isEmpty()).toBe(true);
    buffer.put(1);
    expect(buffer.isEmpty()).toBe(false);
  });
});
