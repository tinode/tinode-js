/**
 * @file Utilities used in multiple places.
 *
 * @copyright 2015-2022 Tinode LLC.
 */
'use strict';

import AccessMode from './access-mode.js';
import {
  DEL_CHAR,
  LOCAL_SEQID
} from './config.js';

// Attempt to convert date and AccessMode strings to objects.
export function jsonParseHelper(key, val) {
  // Try to convert string timestamps with optional milliseconds to Date,
  // e.g. 2015-09-02T01:45:43[.123]Z
  if (typeof val == 'string' && val.length >= 20 && val.length <= 24 && ['ts', 'touched', 'updated', 'created', 'when', 'deleted', 'expires'].includes(key)) {
    const date = new Date(val);
    if (!isNaN(date)) {
      return date;
    }
  } else if (key === 'acs' && typeof val === 'object') {
    return new AccessMode(val);
  }
  return val;
}

// Checks if URL is a relative url, i.e. has no 'scheme://', including the case of missing scheme '//'.
// The scheme is expected to be RFC-compliant, e.g. [a-z][a-z0-9+.-]*
// example.html - ok
// https:example.com - not ok.
// http:/example.com - not ok.
// ' ↲ https://example.com' - not ok. (↲ means carriage return)
export function isUrlRelative(url) {
  return url && !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/im.test(url);
}

function isValidDate(d) {
  return (d instanceof Date) && !isNaN(d) && (d.getTime() != 0);
}

// RFC3339 formater of Date
export function rfc3339DateString(d) {
  if (!isValidDate(d)) {
    return undefined;
  }

  const pad = function(val, sp) {
    sp = sp || 2;
    return '0'.repeat(sp - ('' + val).length) + val;
  };

  const millis = d.getUTCMilliseconds();
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) +
    (millis ? '.' + pad(millis, 3) : '') + 'Z';
}

// Recursively merge src's own properties to dst.
// Ignore properties where ignore[property] is true.
// Array and Date objects are shallow-copied.
export function mergeObj(dst, src, ignore) {
  if (typeof src != 'object') {
    if (src === undefined) {
      return dst;
    }
    if (src === DEL_CHAR) {
      return undefined;
    }
    return src;
  }
  // JS is crazy: typeof null is 'object'.
  if (src === null) {
    return src;
  }

  // Handle Date
  if (src instanceof Date && !isNaN(src)) {
    return (!dst || !(dst instanceof Date) || isNaN(dst) || dst < src) ? src : dst;
  }

  // Access mode
  if (src instanceof AccessMode) {
    return new AccessMode(src);
  }

  // Handle Array
  if (src instanceof Array) {
    return src;
  }

  if (!dst || dst === DEL_CHAR) {
    dst = src.constructor();
  }

  for (let prop in src) {
    if (src.hasOwnProperty(prop) && (!ignore || !ignore[prop]) && (prop != '_noForwarding')) {
      try {
        dst[prop] = mergeObj(dst[prop], src[prop]);
      } catch (err) {
        // FIXME: probably need to log something here.
      }
    }
  }
  return dst;
}

// Update object stored in a cache. Returns updated value.
export function mergeToCache(cache, key, newval, ignore) {
  cache[key] = mergeObj(cache[key], newval, ignore);
  return cache[key];
}

// Strips all values from an object of they evaluate to false or if their name starts with '_'.
// Used on all outgoing object before serialization to string.
export function simplify(obj) {
  Object.keys(obj).forEach((key) => {
    if (key[0] == '_') {
      // Strip fields like "obj._key".
      delete obj[key];
    } else if (!obj[key]) {
      // Strip fields which evaluate to false.
      delete obj[key];
    } else if (Array.isArray(obj[key]) && obj[key].length == 0) {
      // Strip empty arrays.
      delete obj[key];
    } else if (!obj[key]) {
      // Strip fields which evaluate to false.
      delete obj[key];
    } else if (obj[key] instanceof Date) {
      // Strip invalid or zero date.
      if (!isValidDate(obj[key])) {
        delete obj[key];
      }
    } else if (typeof obj[key] == 'object') {
      simplify(obj[key]);
      // Strip empty objects.
      if (Object.getOwnPropertyNames(obj[key]).length == 0) {
        delete obj[key];
      }
    }
  });
  return obj;
};


// Trim whitespace, convert to lowercase, strip empty, short, and duplicate elements elements.
// If the result is an empty array, add a single element "\u2421" (Unicode Del character).
export function normalizeArray(arr) {
  let out = [];
  if (Array.isArray(arr)) {
    // Trim, throw away very short and empty tags.
    for (let i = 0, l = arr.length; i < l; i++) {
      let t = arr[i];
      if (t) {
        t = t.trim().toLowerCase();
        if (t.length > 1) {
          out.push(t);
        }
      }
    }
    out = out.sort().filter((item, pos, ary) => {
      return !pos || item != ary[pos - 1];
    });
  }
  if (out.length == 0) {
    // Add single tag with a Unicode Del character, otherwise an ampty array
    // is ambiguos. The Del tag will be stripped by the server.
    out.push(DEL_CHAR);
  }
  return out;
}

// Convert input to valid ranges of IDs.
export function normalizeRanges(ranges, maxSeq) {
  if (!Array.isArray(ranges)) {
    return [];
  }

  // Sort ranges in accending order by low, then descending by hi.
  ranges.sort((r1, r2) => {
    if (r1.low < r2.low) {
      return -1;
    }
    if (r1.low == r2.low) {
      return (r2.hi | 0) - r1.hi;
    }
    return 1;
  });

  // Remove pending messages from ranges possibly clipping some ranges.
  ranges = ranges.reduce((out, r) => {
    if (r.low < LOCAL_SEQID && r.low > 0) {
      if (!r.hi || r.hi < LOCAL_SEQID) {
        out.push(r);
      } else {
        // Clip hi to max allowed value.
        out.push({
          low: r.low,
          hi: maxSeq + 1
        });
      }
    }
    return out;
  }, []);

  // Merge overlapping ranges.
  ranges = ranges.reduce((out, r) => {
    if (out.length == 0) {
      out.push(r);
    } else {
      let prev = out[out.length - 1];
      if (r.low <= prev.hi) {
        prev.hi = Math.max(prev.hi, r.hi);
      } else {
        out.push(r);
      }
    }
    return out;
  }, []);

  return ranges;
}

// Convert array of IDs to array of ranges.
export function listToRanges(list) {
  // Sort the list in ascending order
  list.sort((a, b) => a - b);
  // Convert the array of IDs to ranges.
  return list.reduce((out, id) => {
    if (out.length == 0) {
      // First element.
      out.push({
        low: id
      });
    } else {
      let prev = out[out.length - 1];
      if ((!prev.hi && (id != prev.low + 1)) || (id > prev.hi)) {
        // New range.
        out.push({
          low: id
        });
      } else {
        // Expand existing range.
        prev.hi = prev.hi ? Math.max(prev.hi, id + 1) : id + 1;
      }
    }
    return out;
  }, []);
}

// Cuts 'clip' range out of the 'src' range.
// Returns an array with 0, 1 or 2 elements.
export function clipOutRange(src, clip) {
  if (clip.hi <= src.low || clip.low >= src.hi) {
    // Clip is completely outside of src, no intersection.
    return [src];
  }


  if (clip.low <= src.low) {
    if (clip.hi >= src.hi) {
      // The source range is completely inside the clipping range.
      return [];
    }
    // Partial clipping at the top.
    return [{
      low: clip.hi,
      hi: src.hi
    }];
  }

  // Range on the lower end.
  const result = [{
    low: src.low,
    hi: clip.low
  }];
  if (clip.hi < src.hi) {
    // Maybe a range on the higher end, if clip is completely inside the source.
    result.push({
      low: clip.hi,
      hi: src.hi
    });
  }

  return result;
}

// Cuts 'src' range to be completely within 'clip' range.
// Returns clipped range or null if 'src' is outside of 'clip'.
export function clipInRange(src, clip) {
  if (clip.hi <= src.low || clip.low >= src.hi) {
    // The src is completely outside of the clip, no intersection.
    return null;
  }

  if (src.low >= clip.low && src.hi <= clip.hi) {
    // Src is completely within the clip, return the entire src.
    return src;
  }

  // Partial overlap.
  return {
    low: Math.max(src.low, clip.low),
    hi: Math.min(src.hi, clip.hi)
  };

  return result;
}
