/**
 * @file In-memory sorted cache of objects.
 *
 * @copyright 2015-2025 Tinode LLC.
 */
'use strict';

/**
 * In-memory sorted cache of objects.
 *
 * @class CBuffer
 * @memberof Tinode
 * @protected
 *
 * @param {function} compare custom comparator of objects. Takes two parameters <code>a</code> and <code>b</code>;
 *    returns <code>-1</code> if <code>a < b</code>, <code>0</code> if <code>a == b</code>, <code>1</code> otherwise.
 * @param {boolean} unique enforce element uniqueness: when <code>true</code> replace existing element with a new
 *    one on conflict; when <code>false</code> keep both elements.
 */
export default class CBuffer {
  #comparator = undefined;
  #unique = false;
  buffer = [];

  constructor(compare_, unique_) {
    this.#comparator = compare_ || ((a, b) => {
      return a === b ? 0 : a < b ? -1 : 1;
    });
    this.#unique = unique_;
  }

  #findNearest(elem, arr, exact) {
    let start = 0;
    let end = arr.length - 1;
    let pivot = 0;
    let diff = 0;
    let found = false;

    while (start <= end) {
      pivot = (start + end) / 2 | 0;
      diff = this.#comparator(arr[pivot], elem);
      if (diff < 0) {
        start = pivot + 1;
      } else if (diff > 0) {
        end = pivot - 1;
      } else {
        found = true;
        break;
      }
    }
    if (found) {
      return {
        idx: pivot,
        exact: true
      };
    }
    if (exact) {
      return {
        idx: -1
      };
    }
    // Not exact - insertion point
    return {
      idx: diff < 0 ? pivot + 1 : pivot
    };
  }

  // Insert element into a sorted array.
  #insertSorted(elem, arr) {
    const found = this.#findNearest(elem, arr, false);
    const count = (found.exact && this.#unique) ? 1 : 0;
    arr.splice(found.idx, count, elem);
    return arr;
  }

  /**
   * Get an element at the given position.
   * @memberof Tinode.CBuffer#
   * @param {number} at - Position to fetch from.
   * @returns {Object} Element at the given position or <code>undefined</code>.
   */
  getAt(at) {
    return this.buffer[at];
  }

  /**
   * Convenience method for getting the last element from the buffer.
   * @memberof Tinode.CBuffer#
   * @param {function} filter - optional filter to apply to elements. If filter is provided, the search
   *   for the last element starts from the end of the buffer and goes backwards until the filter returns true.
   * @returns {Object} The last element in the buffer or <code>undefined</code> if buffer is empty.
   */
  getLast(filter) {
    return filter ?
      this.buffer.findLast(filter) :
      this.buffer[this.buffer.length - 1];
  }

  /**
   * Insert new element(s) to the buffer at the correct position according to the sort method.
   * Variadic: takes one or more arguments. If an array is passed as a single argument, its
   * elements are inserted individually.
   * @memberof Tinode.CBuffer#
   *
   * @param {...Object|Array} - One or more objects to insert.
   */
  put() {
    let insert;
    // inspect arguments: if array, insert its elements, if one or more non-array arguments, insert them one by one
    if (arguments.length == 1 && Array.isArray(arguments[0])) {
      insert = arguments[0];
    } else {
      insert = arguments;
    }
    for (let idx in insert) {
      this.#insertSorted(insert[idx], this.buffer);
    }
  }

  /**
   * Remove element at the given position.
   * @memberof Tinode.CBuffer#
   * @param {number} at - Position to delete at.
   * @returns {Object} Element at the given position or <code>undefined</code>.
   */
  delAt(at) {
    at |= 0;
    let r = this.buffer.splice(at, 1);
    if (r && r.length > 0) {
      return r[0];
    }
    return undefined;
  }

  /**
   * Remove elements between two positions.
   * @memberof Tinode.CBuffer#
   * @param {number} since - Position to delete from (inclusive).
   * @param {number} before - Position to delete to (exclusive).
   *
   * @returns {Array} array of removed elements (could be zero length).
   */
  delRange(since, before) {
    return this.buffer.splice(since, before - since);
  }

  /**
   * Return the number of elements the buffer holds.
   * @memberof Tinode.CBuffer#
   * @return {number} Number of elements in the buffer.
   */
  length() {
    return this.buffer.length;
  }

  /**
   * Reset the buffer discarding all elements
   * @memberof Tinode.CBuffer#
   */
  reset() {
    this.buffer = [];
  }

  /**
   * Callback for iterating contents of buffer. See {@link Tinode.CBuffer#forEach}.
   * @callback ForEachCallbackType
   * @memberof Tinode.CBuffer#
   * @param {Object} elem - Current element of the buffer.
   * @param {Object} prev - Previous element of the buffer.
   * @param {Object} next - Next element of the buffer.
   * @param {number} index - Index of the current element.
   */

  /**
   * Apply given <code>callback</code> to all elements of the buffer.
   * @memberof Tinode.CBuffer#
   *
   * @param {Tinode.ForEachCallbackType} callback - Function to call for each element.
   * @param {number} startIdx - Optional index to start iterating from (inclusive), default: 0.
   * @param {number} beforeIdx - Optional index to stop iterating before (exclusive), default: length of the buffer.
   * @param {Object} context - calling context (i.e. value of <code>this</code> in callback)
   */
  forEach(callback, startIdx, beforeIdx, context) {
    startIdx = Math.max(0, startIdx | 0);
    beforeIdx = Math.min(beforeIdx || this.buffer.length, this.buffer.length);

    for (let i = startIdx; i < beforeIdx; i++) {
      callback.call(context, this.buffer[i],
        (i > startIdx ? this.buffer[i - 1] : undefined),
        (i < beforeIdx - 1 ? this.buffer[i + 1] : undefined), i);
    }
  }

  /**
   * Find element in buffer using buffer's comparison function.
   * @memberof Tinode.CBuffer#
   *
   * @param {Object} elem - element to find.
   * @param {boolean=} nearest - when true and exact match is not found, return the nearest element (insertion point).
   * @returns {number} index of the element in the buffer or -1.
   */
  find(elem, nearest) {
    const {
      idx
    } = this.#findNearest(elem, this.buffer, !nearest);
    return idx;
  }

  /**
   * Callback for filtering the buffer. See {@link Tinode.CBuffer#filter}.
   * @callback FilterCallbackType
   * @memberof Tinode.CBuffer#
   * @param {Object} elem - Current element of the buffer.
   * @param {number} index - Index of the current element.
   * @returns {boolen} <code>true</code> to keep the element, <code>false</code> to remove.
   */

  /**
   * Remove all elements that do not pass the test implemented by the provided callback function.
   * @memberof Tinode.CBuffer#
   *
   * @param {Tinode.FilterCallbackType} callback - Function to call for each element.
   * @param {Object} context - calling context (i.e. value of <code>this</code> in the callback)
   */
  filter(callback, context) {
    let count = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      if (callback.call(context, this.buffer[i], i)) {
        this.buffer[count] = this.buffer[i];
        count++;
      }
    }

    this.buffer.splice(count);
  }

  /**
   * Check if buffer is empty.
   * @returns {boolean} <code>true</code> if the buffer is empty, <code>false</code> otherwise.
   */
  isEmpty() {
    return this.buffer.length == 0;
  }
}
