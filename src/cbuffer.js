/**
 * @file In-memory sorted cache of objects.
 *
 * @copyright 2015-2021 Tinode
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.18
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
 * @param {function} isSub returns <code>true</code> if <code>the argument</code> is meant to replace another object.
 * @param {function} finalizeMsg returns the final (finalize) representation of <code>object/argument</code>.
 */
const CBuffer = function(compare, unique, isSub, finalizeMsg) {
  let buffer = [];

  compare = compare || function(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
  };

  isSub = isSub || function(msg) {
    return false;
  };

  finalizeMsg = finalizeMsg || function(msg) {
    return msg;
  };

  function findNearest(elem, arr, exact) {
    let start = 0;
    let end = arr.length - 1;
    let pivot = 0;
    let diff = 0;
    let found = false;

    while (start <= end) {
      pivot = (start + end) / 2 | 0;
      diff = compare(arr[pivot], elem);
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
  function insertSorted(elem, arr) {
    const found = findNearest(elem, arr, false);
    const count = (found.exact && unique) ? 1 : 0;
    arr.splice(found.idx, count, elem);
    return arr;
  }

  return {
    /**
     * Get an element at the given position.
     * @memberof Tinode.CBuffer#
     * @param {number} at - Position to fetch from.
     * @returns {Object} Element at the given position or <code>undefined</code>.
     */
    getAt: function(at) {
      return buffer[at];
    },

    /**
     * Convenience method for getting the element from the end of the buffer.
     * @memberof Tinode.CBuffer#
     * @param {number} at - position to fetch from, counting from the end;
     *    <code>undefined</code> or <code>null</code>  mean "last".
     * @returns {Object} The last element in the buffer or <code>undefined</code> if buffer is empty.
     */
    getLast: function(at) {
      at |= 0;
      return buffer.length > at ? buffer[buffer.length - 1 - at] : undefined;
    },

    /**
     * Add new element(s) to the buffer. Variadic: takes one or more arguments. If an array is passed as a single
     * argument, its elements are inserted individually.
     * @memberof Tinode.CBuffer#
     *
     * @param {...Object|Array} - One or more objects to insert.
     */
    put: function() {
      let insert;
      // inspect arguments: if array, insert its elements, if one or more non-array arguments, insert them one by one
      if (arguments.length == 1 && Array.isArray(arguments[0])) {
        insert = arguments[0];
      } else {
        insert = arguments;
      }
      for (let idx in insert) {
        insertSorted(insert[idx], buffer);
      }
    },

    /**
     * Remove element at the given position.
     * @memberof Tinode.CBuffer#
     * @param {number} at - Position to delete at.
     * @returns {Object} Element at the given position or <code>undefined</code>.
     */
    delAt: function(at) {
      at |= 0;
      let r = buffer.splice(at, 1);
      if (r && r.length > 0) {
        return r[0];
      }
      return undefined;
    },

    /**
     * Remove elements between two positions.
     * @memberof Tinode.CBuffer#
     * @param {number} since - Position to delete from (inclusive).
     * @param {number} before - Position to delete to (exclusive).
     *
     * @returns {Array} array of removed elements (could be zero length).
     */
    delRange: function(since, before) {
      return buffer.splice(since, before - since);
    },

    /**
     * Return the number of elements the buffer holds.
     * @memberof Tinode.CBuffer#
     * @return {number} Number of elements in the buffer.
     */
    length: function() {
      return buffer.length;
    },

    /**
     * Reset the buffer discarding all elements
     * @memberof Tinode.CBuffer#
     */
    reset: function() {
      buffer = [];
    },

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
     * @param {number} startIdx - Optional index to start iterating from (inclusive).
     * @param {number} beforeIdx - Optional index to stop iterating before (exclusive).
     * @param {Object} context - calling context (i.e. value of <code>this</code> in callback)
     */
    forEach: function(callback, startIdx, beforeIdx, context) {
      startIdx = startIdx | 0;
      beforeIdx = beforeIdx || buffer.length;
      let prevIdx = startIdx - 1;
      let curIdx = startIdx;
      while (curIdx < beforeIdx && isSub(buffer[curIdx])) {
        curIdx++;
      }
      let nextIdx = curIdx + 1;
      while (nextIdx < beforeIdx && isSub(buffer[nextIdx])) {
        nextIdx++;
      }

      let prev = undefined;
      let cur = curIdx < beforeIdx ? finalizeMsg(buffer[curIdx]) : undefined;
      let next = nextIdx < beforeIdx ? finalizeMsg(buffer[nextIdx]) : undefined;
      while (curIdx < beforeIdx) {
        callback.call(context, cur, prev, next, curIdx);
        prevIdx = curIdx;
        curIdx = nextIdx;
        do nextIdx++; while (nextIdx < beforeIdx && isSub(buffer[nextIdx]));
        // Update finalize messages.
        prev = cur;
        cur = next;
        next = nextIdx < beforeIdx ? finalizeMsg(buffer[nextIdx]) : undefined;
      }
    },

    /**
     * Find element in buffer using buffer's comparison function.
     * @memberof Tinode.CBuffer#
     *
     * @param {Object} elem - element to find.
     * @param {boolean=} nearest - when true and exact match is not found, return the nearest element (insertion point).
     * @returns {number} index of the element in the buffer or -1.
     */
    find: function(elem, nearest) {
      const {
        idx
      } = findNearest(elem, buffer, !nearest);
      return idx;
    },

    /**
     * Callback for filtering the buffer. See {@link Tinode.CBuffer#filter}.
     * @callback ForEachCallbackType
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
    filter: function(callback, context) {
      let count = 0;
      for (let i = 0; i < buffer.length; i++) {
        if (callback.call(context, buffer[i], i)) {
          buffer[count] = buffer[i];
          count++;
        }
      }

      buffer.splice(count);
    }
  }
}

if (typeof module != 'undefined') {
  module.exports = CBuffer;
}
