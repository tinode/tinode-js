import {
  isUrlRelative,
  rfc3339DateString,
  mergeObj,
  simplify,
  normalizeArray,
  normalizeRanges,
  listToRanges,
  clipInRange,
  clipOutRange
} from "./utils";
import {
  DEL_CHAR
} from './config.js';

test('isUrlRelative', () => {
  expect(isUrlRelative('example.html')).toBe(true);
  expect(isUrlRelative('https:example.com')).toBe(false);
  expect(isUrlRelative('http:/example.com')).toBe(false);
  expect(isUrlRelative(' \n https://example.com')).toBe(false);
});

test('rfc3339DateString', () => {
  expect(rfc3339DateString(new Date(Date.UTC(2020, 1, 2, 3, 4, 5, 6)))).toBe('2020-02-02T03:04:05.006Z');
  expect(rfc3339DateString(new Date(Date.UTC(2020, 1, 2, 3, 4, 5)))).toBe('2020-02-02T03:04:05Z');
  expect(rfc3339DateString(new Date(0))).toBe(undefined);
  expect(rfc3339DateString(new Date(''))).toBe(undefined);
});

// Recursively merge src's own properties to dst.
// Ignore properties where ignore[property] is true.
// Array and Date objects are shallow-copied.
test('mergeObj', () => {
  const dst = {
    a: 1,
    b: 2
  };
  const src = {
    b: 3,
    c: 4
  };
  expect(mergeObj({
    a: 1,
    b: 2
  }, {
    b: 3,
    c: 4
  }, {
    b: true
  })).toEqual({
    a: 1,
    b: 2,
    c: 4
  });
  expect(mergeObj({
    a: 1,
    b: 2
  }, {
    b: 3,
    c: 4
  })).toEqual({
    a: 1,
    b: 3,
    c: 4
  });
  expect(mergeObj({
    a: 1,
    b: 2
  }, {
    b: 3,
    c: 4
  }, {
    a: true,
    b: true
  })).toEqual({
    a: 1,
    b: 2,
    c: 4
  });
  expect(mergeObj({
    a: 1,
    b: 2
  }, {
    b: 3,
    c: 4
  }, {
    a: true,
    b: true,
    c: true
  })).toEqual({
    a: 1,
    b: 2
  });
  expect(mergeObj(undefined, {
    b: 3,
    c: 4
  })).toEqual({
    b: 3,
    c: 4
  });
  expect(mergeObj({
    a: 1,
    b: 2
  }, undefined)).toEqual({
    a: 1,
    b: 2
  });
  expect(mergeObj({
    a: 1,
    b: 2
  }, null)).toEqual(null);
  expect(mergeObj({
    a: 1,
    b: 2
  }, 1)).toEqual(1);
});

// Strips all values from an object of they evaluate to false or if their name starts with '_'.
// Used on all outgoing object before serialization to string.
test('simplify', () => {
  const obj = {
    a: 1,
    b: 0,
    c: '',
    d: null,
    e: undefined,
    f: false,
    g: true,
    h: {},
    i: {
      j: 1
    },
    k: [],
    l: [1],
    m: new Date(0),
    n: new Date(),
    o: new Date(''),
    p: new Date('2020-02-02T03:04:05.006Z'),
    _q: 1,
    _r: 0,
    _s: '',
    _t: null,
    _u: undefined,
    _v: false,
    _w: true,
    _x: {},
    _y: {
      j: 1
    },
    _z: [],
    _1: [1],
    _2: new Date(0),
    _3: new Date(),
    _4: new Date(''),
    _5: new Date('2020-02-02T03:04:05.006Z')
  };
  expect(simplify(obj)).toEqual({
    a: 1,
    g: true,
    i: {
      j: 1
    },
    l: [1],
    n: obj.n,
    p: obj.p
  });
});

// Trim whitespace, convert to lowercase, strip empty, short, and duplicate elements elements.
// If the result is an empty array, add a single element "\u2421" (Unicode Del character).
test('normalizeArray', () => {
  expect(normalizeArray(null)).toEqual([DEL_CHAR]);
  expect(normalizeArray([])).toEqual([DEL_CHAR]);
  expect(normalizeArray([''])).toEqual([DEL_CHAR]);
  expect(normalizeArray(['', ''])).toEqual([DEL_CHAR]);
  expect(normalizeArray(['', ' ', ''])).toEqual([DEL_CHAR]);
  expect(normalizeArray(['a', 'aa'])).toEqual(['aa']);
  expect(normalizeArray(['aA'])).toEqual(['aa']);
  expect(normalizeArray(['aa', 'bb'])).toEqual(['aa', 'bb']);
  expect(normalizeArray(['aa', 'bb', 'aa'])).toEqual(['aa', 'bb']);
  expect(normalizeArray(['aa', 'bb', 'aa', 'bb'])).toEqual(['aa', 'bb']);
  expect(normalizeArray(['aa ', 'bb', 'Aa', 'bb', 'Cc'])).toEqual(['aa', 'bb', 'cc']);
});

test('normalizeRanges', () => {
  expect(normalizeRanges('hello', 100)).toEqual([]);
  expect(normalizeRanges(null, 100)).toEqual([]);
  expect(normalizeRanges({
    a: 1
  }, 100)).toEqual([]);
  expect(normalizeRanges([{
    a: 1
  }, {
    b: 2
  }], 100)).toEqual([]);
  expect(normalizeRanges([], 100)).toEqual([]);
  expect(normalizeRanges([{}], 100)).toEqual([]);
  expect(normalizeRanges([{
    low: 1
  }], 100)).toEqual([{
    low: 1
  }]);
  expect(normalizeRanges([{
    low: 1,
    hi: 2
  }], 100)).toEqual([{
    low: 1,
    hi: 2
  }]);
  expect(normalizeRanges([{
    low: 1,
    hi: 101
  }], 90)).toEqual([{
    low: 1,
    hi: 101
  }]);
  expect(normalizeRanges([{
    low: 1,
    hi: 101
  }, {
    low: 2,
    hi: 102
  }], 100)).toEqual([{
    low: 1,
    hi: 102
  }]);
  expect(normalizeRanges([{
    low: 2,
    hi: 102
  }, {
    low: 1,
    hi: 101
  }], 100)).toEqual([{
    low: 1,
    hi: 102
  }]);
  expect(normalizeRanges([{
    low: 1,
    hi: 101
  }, {
    low: 2,
    hi: 102
  }, {
    low: 102,
    hi: 110
  }], 100)).toEqual([{
    low: 1,
    hi: 110
  }]);
  expect(normalizeRanges([{
    low: 102,
    hi: 110
  }, {
    low: 2,
    hi: 102
  }, {
    low: 1,
    hi: 101
  }], 100)).toEqual([{
    low: 1,
    hi: 110
  }]);
  expect(normalizeRanges([{
    low: 1,
    hi: 101
  }, {
    low: 22,
    hi: 120
  }, {
    low: 122,
    hi: 125
  }], 100)).toEqual([{
    low: 1,
    hi: 120
  }, {
    low: 122,
    hi: 125
  }]);
});

// Convert array of IDs to array of ranges.
test('listToRanges', () => {
  expect(listToRanges([])).toEqual([]);
  expect(listToRanges([1])).toEqual([{
    low: 1
  }]);
  expect(listToRanges([1, 2])).toEqual([{
    low: 1,
    hi: 3
  }]);
  expect(listToRanges([1, 2, 3])).toEqual([{
    low: 1,
    hi: 4
  }]);
  expect(listToRanges([1, 2, 3, 5])).toEqual([{
    low: 1,
    hi: 4
  }, {
    low: 5
  }]);
  expect(listToRanges([5, 3, 2, 1])).toEqual([{
    low: 1,
    hi: 4
  }, {
    low: 5
  }]);
  expect(listToRanges([1, 2, 3, 5, 6, 7])).toEqual([{
    low: 1,
    hi: 4
  }, {
    low: 5,
    hi: 8
  }]);
});

// Cuts 'clip' range out of the 'src' range.
// Returns an array with 0, 1 or 2 elements.
test('clipOutRange', () => {
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 10,
    hi: 20
  })).toEqual([]);
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 5,
    hi: 30
  })).toEqual([]);
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 30,
    hi: 40
  })).toEqual([{
    low: 10,
    hi: 20
  }]);
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 1,
    hi: 5
  })).toEqual([{
    low: 10,
    hi: 20
  }]);
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 1,
    hi: 15
  })).toEqual([{
    low: 15,
    hi: 20
  }]);
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 15,
    hi: 30
  })).toEqual([{
    low: 10,
    hi: 15
  }]);
  expect(clipOutRange({
    low: 10,
    hi: 20
  }, {
    low: 12,
    hi: 17
  })).toEqual([{
    low: 10,
    hi: 12
  }, {
    low: 17,
    hi: 20
  }]);
});

// Cuts 'src' range to be completely within 'clip' range.
// Returns clipped range or null if 'src' is outside of 'clip'.
test('clipInRange', () => {
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 21,
    hi: 30
  })).toBeNull();
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 10,
    hi: 20
  })).toEqual({
    low: 10,
    hi: 20
  });
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 5,
    hi: 30
  })).toEqual({
    low: 10,
    hi: 20
  });
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 1,
    hi: 15
  })).toEqual({
    low: 10,
    hi: 15
  });
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 1,
    hi: 5
  })).toBeNull();
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 1,
    hi: 10
  })).toBeNull();
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 20,
    hi: 30
  })).toBeNull();
  expect(clipInRange({
    low: 10,
    hi: 20
  }, {
    low: 15,
    hi: 30
  })).toEqual({
    low: 15,
    hi: 20
  });
});
