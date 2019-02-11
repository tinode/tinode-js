/**
 * @copyright 2015-2018 Tinode
 * @summary Minimally rich text representation and formatting for Tinode.
 * @license Apache 2.0
 * @version 0.15
 *
 * @file Basic parser and formatter for very simple text markup. Mostly targeted at
 * mobile use cases similar to Telegram, WhatsApp, and FB Messenger.
 *
 * <p>Supports conversion of user keyboard input to formatted text:</p>
 * <ul>
 *   <li>*abc* &rarr; <b>abc</b></li>
 *   <li>_abc_ &rarr; <i>abc</i></li>
 *   <li>~abc~ &rarr; <del>abc</del></li>
 *   <li>`abc` &rarr; <tt>abc</tt></li>
 * </ul>
 * Also supports forms and buttons.
 *
 * Nested formatting is supported, e.g. *abc _def_* -> <b>abc <i>def</i></b>
 * URLs, @mentions, and #hashtags are extracted and converted into links.
 * Forms and buttons can be added procedurally.
 * JSON data representation is inspired by Draft.js raw formatting.
 *
 *
 * @example
 * Text:
 * <pre>
 *     this is *bold*, `code` and _italic_, ~strike~
 *     combined *bold and _italic_*
 *     an url: https://www.example.com/abc#fragment and another _www.tinode.co_
 *     this is a @mention and a #hashtag in a string
 *     second #hashtag
 * </pre>
 *
 *  Sample JSON representation of the text above:
 *  {
 *     "txt": "this is bold, code and italic, strike combined bold and italic an url: https://www.example.com/abc#fragment " +
 *             "and another www.tinode.co this is a @mention and a #hashtag in a string second #hashtag",
 *     "fmt": [
 *         { "at":8, "len":4,"tp":"ST" },{ "at":14, "len":4, "tp":"CO" },{ "at":23, "len":6, "tp":"EM"},
 *         { "at":31, "len":6, "tp":"DL" },{ "tp":"BR", "len":1, "at":37 },{ "at":56, "len":6, "tp":"EM" },
 *         { "at":47, "len":15, "tp":"ST" },{ "tp":"BR", "len":1, "at":62 },{ "at":120, "len":13, "tp":"EM" },
 *         { "at":71, "len":36, "key":0 },{ "at":120, "len":13, "key":1 },{ "tp":"BR", "len":1, "at":133 },
 *         { "at":144, "len":8, "key":2 },{ "at":159, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":179 },
 *         { "at":187, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":195 }
 *     ],
 *     "ent": [
 *         { "tp":"LN", "data":{ "url":"https://www.example.com/abc#fragment" } },
 *         { "tp":"LN", "data":{ "url":"http://www.tinode.co" } },
 *         { "tp":"MN", "data":{ "val":"mention" } },
 *         { "tp":"HT", "data":{ "val":"hashtag" } }
 *     ]
 *  }
 */

'use strict';

const MAX_FORM_ELEMENTS = 8;
const JSON_MIME_TYPE = 'application/json';

// Regular expressions for parsing inline formats. Javascript does not support lookbehind,
// so it's a bit messy.
const INLINE_STYLES = [
  // Strong = bold, *bold text*
  {
    name: 'ST',
    start: /(?:^|\W)(\*)[^\s*]/,
    end: /[^\s*](\*)(?=$|\W)/
  },
  // Emphesized = italic, _italic text_
  {
    name: 'EM',
    start: /(?:^|[\W_])(_)[^\s_]/,
    end: /[^\s_](_)(?=$|[\W_])/
  },
  // Deleted, ~strike this though~
  {
    name: 'DL',
    start: /(?:^|\W)(~)[^\s~]/,
    end: /[^\s~](~)(?=$|\W)/
  },
  // Code block `this is monospace`
  {
    name: 'CO',
    start: /(?:^|\W)(`)[^`]/,
    end: /[^`](`)(?=$|\W)/
  }
];

// RegExps for entity extraction (RF = reference)
const ENTITY_TYPES = [
  // URLs
  {
    name: 'LN',
    dataName: 'url',
    pack: function(val) {
      // Check if the protocol is specified, if not use http
      if (!/^[a-z]+:\/\//i.test(val)) {
        val = 'http://' + val;
      }
      return {
        url: val
      };
    },
    re: /(?:(?:https?|ftp):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]/ig
  },
  // Mentions @user (must be 2 or more characters)
  {
    name: 'MN',
    dataName: 'val',
    pack: function(val) {
      return {
        val: val.slice(1)
      };
    },
    re: /\B@(\w\w+)/g
  },
  // Hashtags #hashtag, like metion 2 or more characters.
  {
    name: 'HT',
    dataName: 'val',
    pack: function(val) {
      return {
        val: val.slice(1)
      };
    },
    re: /\B#(\w\w+)/g
  }
];

// HTML tag name suggestions
const HTML_TAGS = {
  ST: {
    name: 'b',
    isVoid: false
  },
  EM: {
    name: 'i',
    isVoid: false
  },
  DL: {
    name: 'del',
    isVoid: false
  },
  CO: {
    name: 'tt',
    isVoid: false
  },
  BR: {
    name: 'br',
    isVoid: true
  },
  LN: {
    name: 'a',
    isVoid: false
  },
  MN: {
    name: 'a',
    isVoid: false
  },
  HT: {
    name: 'a',
    isVoid: false
  },
  IM: {
    name: 'img',
    isVoid: true
  },
  FM: {
    name: 'div',
    isVoid: false
  },
  RW: {
    name: 'div',
    isVoid: false,
  },
  BN: {
    name: 'button',
    isVoid: false
  },
  HD: {
    name: '',
    isVoid: false
  }
};

// Convert base64-encoded string into Blob.
function base64toObjectUrl(b64, contentType) {
  let bin;
  try {
    bin = atob(b64);
    let length = bin.length;
    let buf = new ArrayBuffer(length);
    let arr = new Uint8Array(buf);
    for (let i = 0; i < length; i++) {
      arr[i] = bin.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([buf], {
      type: contentType
    }));
  } catch (err) {
    console.log("Drafty: failed to convert object.", err.message);
  }

  return null;
}

// Helpers for converting Drafty to HTML.
const DECORATORS = {
  // Visial styles
  ST: {
    open: function() {
      return '<b>';
    },
    close: function() {
      return '</b>';
    }
  },
  EM: {
    open: function() {
      return '<i>';
    },
    close: function() {
      return '</i>'
    }
  },
  DL: {
    open: function() {
      return '<del>';
    },
    close: function() {
      return '</del>'
    }
  },
  CO: {
    open: function() {
      return '<tt>';
    },
    close: function() {
      return '</tt>'
    }
  },
  // Line break
  BR: {
    open: function() {
      return '<br/>';
    },
    close: function() {
      return ''
    }
  },
  // Hidden element
  HD: {
    open: function() {
      return '';
    },
    close: function() {
      return '';
    }
  },
  // Link (URL)
  LN: {
    open: function(data) {
      return '<a href="' + data.url + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        href: data.url,
        target: "_blank"
      } : null;
    },
  },
  // Mention
  MN: {
    open: function(data) {
      return '<a href="#' + data.val + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        name: data.val
      } : null;
    },
  },
  // Hashtag
  HT: {
    open: function(data) {
      return '<a href="#' + data.val + '">';
    },
    close: function(data) {
      return '</a>';
    },
    props: function(data) {
      return data ? {
        name: data.val
      } : null;
    },
  },
  // Button
  BN: {
    open: function(data) {
      return '<button>';
    },
    close: function(data) {
      return '</button>';
    },
    props: function(data) {
      return data ? {
        'data-act': data.act,
        'data-val': data.val,
        'data-name': data.name,
        'data-ref': data.ref
      } : null;
    },
  },
  // Image
  IM: {
    open: function(data) {
      // Don't use data.ref for preview: it's a security risk.
      const previewUrl = base64toObjectUrl(data.val, data.mime);
      const downloadUrl = data.ref ? data.ref : previewUrl;
      return (data.name ? '<a href="' + downloadUrl + '" download="' + data.name + '">' : '') +
        '<img src="' + previewUrl + '"' +
        (data.width ? ' width="' + data.width + '"' : '') +
        (data.height ? ' height="' + data.height + '"' : '') + ' border="0" />';
    },
    close: function(data) {
      return (data.name ? '</a>' : '');
    },
    props: function(data) {
      if (!data) return null;
      let url = base64toObjectUrl(data.val, data.mime);
      return {
        src: url,
        title: data.name,
        'data-width': data.width,
        'data-height': data.height,
        'data-name': data.name,
        'data-size': data.val ? (data.val.length * 0.75) | 0 : 0,
        'data-mime': data.mime
      };
    },
  },
  // Form - structured layout of elements.
  FM: {
    open: function(data) {
      return '<div>';
    },
    close: function(data) {
      return '</div>';
    }
  },
  // Row: logic grouping of elements
  RW: {
    open: function(data) {
      return '<div>';
    },
    close: function(data) {
      return '</div>';
    }
  }
};

/**
 * The main object which performs all the formatting actions.
 * @class Drafty
 * @constructor
 */
var Drafty = function() {}

// Take a string and defined earlier style spans, re-compose them into a tree where each leaf is
// a same-style (including unstyled) string. I.e. 'hello *bold _italic_* and ~more~ world' ->
// ('hello ', (b: 'bold ', (i: 'italic')), ' and ', (s: 'more'), ' world');
//
// This is needed in order to clear markup, i.e. 'hello *world*' -> 'hello world' and convert
// ranges from markup-ed offsets to plain text offsets.
function chunkify(line, start, end, spans) {
  var chunks = [];

  if (spans.length == 0) {
    return [];
  }

  for (var i in spans) {
    // Get the next chunk from the queue
    var span = spans[i];

    // Grab the initial unstyled chunk
    if (span.start > start) {
      chunks.push({
        text: line.slice(start, span.start)
      });
    }

    // Grab the styled chunk. It may include subchunks.
    var chunk = {
      type: span.type
    };
    var chld = chunkify(line, span.start + 1, span.end - 1, span.children);
    if (chld.length > 0) {
      chunk.children = chld;
    } else {
      chunk.text = span.text;
    }
    chunks.push(chunk);
    start = span.end + 1; // '+1' is to skip the formatting character
  }

  // Grab the remaining unstyled chunk, after the last span
  if (start < end) {
    chunks.push({
      text: line.slice(start, end)
    });
  }

  return chunks;
}

// Inverse of chunkify. Returns a tree of formatted spans.
function forEach(line, start, end, spans, formatter, context) {
  let result = [];

  // Process ranges calling formatter for each range.
  for (let i = 0; i < spans.length; i++) {
    let span = spans[i];
    if (span.at < 0) {
      // throw out non-visual spans.
      continue;
    }
    // Add un-styled range before the styled span starts.
    if (start < span.at) {
      result.push(formatter.call(context, null, undefined, line.slice(start, span.at), result.length));
      start = span.at;
    }
    // Get all spans which are within current span.
    const subspans = [];
    for (let si = i + 1; si < spans.length && spans[si].at < span.at + span.len; si++) {
      subspans.push(spans[si]);
      i = si;
    }

    const tag = HTML_TAGS[span.tp] || {}
    result.push(formatter.call(context, span.tp, span.data,
      tag.isVoid ? null : forEach(line, start, span.at + span.len, subspans, formatter, context),
      result.length));

    start = span.at + span.len;
  }

  // Add the last unformatted range.
  if (start < end) {
    result.push(formatter.call(context, null, undefined, line.slice(start, end), result.length));
  }

  return result;
}

// Detect starts and ends of formatting spans. Unformatted spans are
// ignored at this stage.
function spannify(original, re_start, re_end, type) {
  let result = [];
  let index = 0;
  let line = original.slice(0); // make a copy;

  while (line.length > 0) {
    // match[0]; // match, like '*abc*'
    // match[1]; // match captured in parenthesis, like 'abc'
    // match['index']; // offset where the match started.

    // Find the opening token.
    let start = re_start.exec(line);
    if (start == null) {
      break;
    }

    // Because javascript RegExp does not support lookbehind, the actual offset may not point
    // at the markup character. Find it in the matched string.
    let start_offset = start['index'] + start[0].lastIndexOf(start[1]);
    // Clip the processed part of the string.
    line = line.slice(start_offset + 1);
    // start_offset is an offset within the clipped string. Convert to original index.
    start_offset += index;
    // Index now point to the beginning of 'line' within the 'original' string.
    index = start_offset + 1;

    // Find the matching closing token.
    let end = re_end ? re_end.exec(line) : null;
    if (end == null) {
      break;
    }
    let end_offset = end['index'] + end[0].indexOf(end[1]);
    // Clip the processed part of the string.
    line = line.slice(end_offset + 1);
    // Update offsets
    end_offset += index;
    // Index now point to the beginning of 'line' within the 'original' string.
    index = end_offset + 1;

    result.push({
      text: original.slice(start_offset + 1, end_offset),
      children: [],
      start: start_offset,
      end: end_offset,
      type: type
    });
  }

  return result;
}

// Convert linear array or spans into a tree representation.
// Keep standalone and nested spans, throw away partially overlapping spans.
function toTree(spans) {
  if (spans.length == 0) {
    return [];
  }

  var tree = [spans[0]];
  var last = spans[0];
  for (var i = 1; i < spans.length; i++) {
    // Keep spans which start after the end of the previous span or those which
    // are complete within the previous span.

    if (spans[i].start > last.end) {
      // Span is completely outside of the previous span.
      tree.push(spans[i]);
      last = spans[i];
    } else if (spans[i].end < last.end) {
      // Span is fully inside of the previous span. Push to subnode.
      last.children.push(spans[i]);
    }
    // Span could partially overlap, ignoring it as invalid.
  }

  // Recursively rearrange the subnodes.
  for (var i in tree) {
    tree[i].children = toTree(tree[i].children);
  }

  return tree;
}

// Get a list of entities from a text.
function extractEntities(line) {
  var match;
  var extracted = [];
  ENTITY_TYPES.map(function(entity) {
    while ((match = entity.re.exec(line)) !== null) {
      extracted.push({
        offset: match['index'],
        len: match[0].length,
        unique: match[0],
        data: entity.pack(match[0]),
        type: entity.name
      });
    }
  });

  if (extracted.length == 0) {
    return extracted;
  }

  // Remove entities detected inside other entities, like #hashtag in a URL.
  extracted.sort(function(a, b) {
    return a.offset - b.offset;
  });

  var idx = -1;
  extracted = extracted.filter(function(el) {
    var result = (el.offset > idx);
    idx = el.offset + el.len;
    return result;
  });

  return extracted;
}

// Convert the chunks into format suitable for serialization.
function draftify(chunks, startAt) {
  var plain = "";
  var ranges = [];
  for (var i in chunks) {
    var chunk = chunks[i];
    if (!chunk.text) {
      var drafty = draftify(chunk.children, plain.length + startAt);
      chunk.text = drafty.txt;
      ranges = ranges.concat(drafty.fmt);
    }

    if (chunk.type) {
      ranges.push({
        at: plain.length + startAt,
        len: chunk.text.length,
        tp: chunk.type
      });
    }

    plain += chunk.text;
  }
  return {
    txt: plain,
    fmt: ranges
  };
}

// Splice two strings: insert second string into the first one at the given index
function splice(src, at, insert) {
  return src.slice(0, at) + insert + src.slice(at);
}

/**
 * Parse plain text into structured representation.
 * @memberof Drafty
 * @static
 *
 * @param {String} content plain-text content to parse.
 * @return {Drafty} parsed object or null if the source is not plain text.
 */
Drafty.parse = function(content) {
  // Make sure we are parsing strings only.
  if (typeof content != 'string') {
    return null;
  }

  // Split text into lines. It makes further processing easier.
  var lines = content.split(/\r?\n/);

  // Holds entities referenced from text
  var entityMap = [];
  var entityIndex = {};

  // Processing lines one by one, hold intermediate result in blx.
  var blx = [];
  lines.map(function(line) {
    var spans = [];
    var entities = [];

    // Find formatted spans in the string.
    // Try to match each style.
    INLINE_STYLES.map(function(style) {
      // Each style could be matched multiple times.
      spans = spans.concat(spannify(line, style.start, style.end, style.name));
    });

    var block;
    if (spans.length == 0) {
      block = {
        txt: line
      };
    } else {
      // Sort spans by style occurence early -> late
      spans.sort(function(a, b) {
        return a.start - b.start;
      });

      // Convert an array of possibly overlapping spans into a tree
      spans = toTree(spans);

      // Build a tree representation of the entire string, not
      // just the formatted parts.
      var chunks = chunkify(line, 0, line.length, spans);

      var drafty = draftify(chunks, 0);

      block = {
        txt: drafty.txt,
        fmt: drafty.fmt
      };
    }

    // Extract entities from the cleaned up string.
    entities = extractEntities(block.txt);
    if (entities.length > 0) {
      var ranges = [];
      for (var i in entities) {
        // {offset: match['index'], unique: match[0], len: match[0].length, data: ent.packer(), type: ent.name}
        var entity = entities[i];
        var index = entityIndex[entity.unique];
        if (!index) {
          index = entityMap.length;
          entityIndex[entity.unique] = index;
          entityMap.push({
            tp: entity.type,
            data: entity.data
          });
        }
        ranges.push({
          at: entity.offset,
          len: entity.len,
          key: index
        });
      }
      block.ent = ranges;
    }

    blx.push(block);
  });

  var result = {
    txt: ""
  };

  // Merge lines and save line breaks as BR inline formatting.
  if (blx.length > 0) {
    result.txt = blx[0].txt;
    result.fmt = (blx[0].fmt || []).concat(blx[0].ent || []);

    for (var i = 1; i < blx.length; i++) {
      var block = blx[i];
      var offset = result.txt.length + 1;

      result.fmt.push({
        tp: 'BR',
        len: 1,
        at: offset - 1
      });

      result.txt += " " + block.txt;
      if (block.fmt) {
        result.fmt = result.fmt.concat(block.fmt.map(function(s) {
          s.at += offset;
          return s;
        }));
      }
      if (block.ent) {
        result.fmt = result.fmt.concat(block.ent.map(function(s) {
          s.at += offset;
          return s;
        }));
      }
    }

    if (result.fmt.length == 0) {
      delete result.fmt;
    }

    if (entityMap.length > 0) {
      result.ent = entityMap;
    }
  }
  return result;
}

/**
 * Insert inline image into Drafty content.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content object to add image to.
 * @param {integer} at index where the object is inserted. The length of the image is always 1.
 * @param {string} mime mime-type of the image, e.g. "image/png"
 * @param {string} base64bits base64-encoded image content (or preview, if large image is attached)
 * @param {integer} width width of the image
 * @param {integer} height height of the image
 * @param {string} fname file name suggestion for downloading the image.
 * @param {integer} size size of the external file. Treat is as an untrusted hint.
 * @param {string} refurl reference to the content. Could be null or undefined.
 *
 * @return {Drafty} updated content.
 */
Drafty.insertImage = function(content, at, mime, base64bits, width, height, fname, size, refurl) {
  content = content || {
    txt: " "
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: 1,
    key: content.ent.length
  });
  content.ent.push({
    tp: 'IM',
    data: {
      mime: mime,
      val: base64bits,
      width: width,
      height: height,
      name: fname,
      ref: refurl,
      size: size | 0
    }
  });

  return content;
}

/**
 * Append image to Drafty content.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content object to add image to.
 * @param {string} mime mime-type of the image, e.g. "image/png"
 * @param {string} base64bits base64-encoded image content (or preview, if large image is attached)
 * @param {integer} width width of the image
 * @param {integer} height height of the image
 * @param {string} fname file name suggestion for downloading the image.
 * @param {integer} size size of the external file. Treat is as an untrusted hint.
 * @param {string} refurl reference to the content. Could be null or undefined.
 *
 * @return {Drafty} updated content.
 */
Drafty.appendImage = function(content, mime, base64bits, width, height, fname, size, refurl) {
  content = content || {
    txt: ""
  };
  content.txt += " ";
  return Drafty.insertImage(content, content.txt.length - 1, mime, base64bits, width, height, fname, size, refurl);
}

/**
 * Attach file to Drafty content. Either as a blob or as a reference.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content object to attach file to.
 * @param {string} mime mime-type of the file, e.g. "image/png"
 * @param {string} base64bits base64-encoded file content
 * @param {string} fname file name suggestion for downloading.
 * @param {integer} size size of the external file. Treat is as an untrusted hint.
 * @param {string | Promise} refurl optional reference to the content.
 *
 * @return {Drafty} updated content.
 */
Drafty.attachFile = function(content, mime, base64bits, fname, size, refurl) {
  content = content || {
    txt: ""
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });

  let ex = {
    tp: 'EX',
    data: {
      mime: mime,
      val: base64bits,
      name: fname,
      ref: refurl,
      size: size | 0
    }
  }
  if (refurl instanceof Promise) {
    ex.data.ref = refurl.then(
      (url) => {
        ex.data.ref = url;
      },
      (err) => {
        /* catch the error, otherwise it will appear in the console. */
      }
    );
  }
  content.ent.push(ex);

  return content;
}

/**
 * Wraps content into an interactive form.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content to wrap into a form.
 * @param {number} at index where the forms starts.
 * @param {number} len length of the form content.
 *
 * @return {Drafty} updated content.
 */
Drafty.wrapAsForm = function(content, at, len) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: len,
    tp: 'FM'
  });

  return content;
}

/**
 * Insert clickable button into Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content is Drafty object to insert button to or a string to be used as button text.
 * @param {number} at is location where the button is inserted.
 * @param {number} len is the length of the text to be used as button title.
 * @param {string} name of the button. Client should return it to the server when the button is clicked.
 * @param {string} actionType is the type of the button, one of 'url' or 'pub'.
 * @param {string} actionValue is the value to return on click:
 * @param {string} refUrl is the URL to go to when the 'url' button is clicked.
 *
 * @return {Drafty} updated content.
 */
Drafty.insertButton = function(content, at, len, name, actionType, actionValue, refUrl) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }

  if (!content || !content.txt || content.txt.length < at + len) {
    return null;
  }

  if (len <= 0 || ['url', 'pub'].indexOf(actionType) == -1) {
    return null;
  }
  // Ensure refUrl is a string.
  if (actionType == 'url' && !refUrl) {
    return null;
  }
  refUrl = '' + refUrl;

  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: at,
    len: len,
    key: content.ent.length
  });
  content.ent.push({
    tp: 'BN',
    data: {
      act: actionType,
      val: actionValue,
      ref: refUrl,
      name: name
    }
  });

  return content;
}

/**
 * Append clickable button to Drafty document.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty|string} content is Drafty object to insert button to or a string to be used as button text.
 * @param {string} title is the text to be used as button title.
 * @param {string} name of the button. Client should return it to the server when the button is clicked.
 * @param {string} actionType is the type of the button, one of 'url' or 'pub'.
 * @param {string} actionValue is the value to return on click:
 * @param {string} refUrl is the URL to go to when the 'url' button is clicked.
 *
 * @return {Drafty} updated content.
 */
Drafty.appendButton = function(content, title, name, actionType, actionValue, refUrl) {
  content = content || {
    txt: ""
  };
  let at = content.txt.length;
  content.txt += title;
  return Drafty.insertButton(content, at, title.length, name, actionType, actionValue, refUrl);
}

/**
 * Attach a generic JS object. The object is attached as a json string.
 * Intended for representing a form response.
 *
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content object to attach file to.
 * @param {Object} data to convert to json string and attach.
 */
Drafty.attachJSON = function(content, data) {
  content = content || {
    txt: ""
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];

  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });

  content.ent.push({
    tp: 'EX',
    data: {
      mime: JSON_MIME_TYPE,
      val: data
    }
  });

  return content;
}

Drafty.appendLineBreak = function(content) {
  content = content || {
    txt: ""
  };
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: content.txt.length,
    len: 1,
    tp: 'BR'
  });
  content.txt += " ";

  return content;
}
/**
 * Given the structured representation of rich text, convert it to HTML.
 * No attempt is made to strip pre-existing html markup.
 * This is potentially unsafe because `content.txt` may contain malicious
 * markup.
 * @memberof Tinode.Drafty
 * @static
 *
 * @param {drafy} content - structured representation of rich text.
 *
 * @return HTML-representation of content.
 */
Drafty.UNSAFE_toHTML = function(content) {
  var {
    txt,
    fmt,
    ent
  } = content;

  var markup = [];
  if (fmt) {
    for (let i in fmt) {
      let range = fmt[i];
      let tp = range.tp,
        data;
      if (!tp) {
        let entity = ent[range.key | 0];
        if (entity) {
          tp = entity.tp;
          data = entity.data;
        }
      }

      if (DECORATORS[tp]) {
        // Because we later sort in descending order, closing markup must come first.
        // Otherwise zero-length objects will not be represented correctly.
        markup.push({
          idx: range.at + range.len,
          len: -range.len,
          what: DECORATORS[tp].close(data)
        });
        markup.push({
          idx: range.at,
          len: range.len,
          what: DECORATORS[tp].open(data)
        });
      }
    }
  }

  markup.sort(function(a, b) {
    return b.idx == a.idx ? b.len - a.len : b.idx - a.idx; // in descending order
  });

  for (var i in markup) {
    if (markup[i].what) {
      txt = splice(txt, markup[i].idx, markup[i].what);
    }
  }

  return txt;
}

/**
 * Callback for applying custom formatting/transformation to a Drafty object.
 * Called once for each syle span.
 * @memberof Drafty
 * @static
 *
 * @callback Formatter
 * @param {string} style style code such as "ST" or "IM".
 * @param {Object} data entity's data
 * @param {Object} values possibly styled subspans contained in this style span.
 * @param {number} index of the current element among its siblings.
 */

/**
 * Transform Drafty using custom formatting.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to transform.
 * @param {Formatter} formatter - callback which transforms individual elements
 * @param {Object} context - context provided to formatter as 'this'.
 *
 * @return {Object} transformed object
 */
Drafty.format = function(content, formatter, context) {
  let {
    txt,
    fmt,
    ent
  } = content;

  // Assign default values.
  txt = txt || "";
  if (!Array.isArray(ent)) {
    ent = [];
  }

  if (!Array.isArray(fmt)) {
    // Handle special case when all values in fmt are 0 and fmt is skipped.
    if (ent.length == 1) {
      fmt = [{
        at: 0,
        len: 0,
        key: 0
      }];
    } else {
      return [txt];
    }
  }

  let spans = [].concat(fmt);

  // Zero values may have been stripped. Restore them.
  // Also ensure indexes and lengths are sane.
  spans.map(function(s) {
    s.at = s.at || 0;
    s.len = s.len || 0;
    if (s.len < 0) {
      s.len = 0;
    }
    if (s.at < -1) {
      s.at = -1;
    }
  });

  // Sort spans first by start index (asc) then by length (desc).
  spans.sort(function(a, b) {
    if (a.at - b.at == 0) {
      return b.len - a.len; // longer one comes first (<0)
    }
    return a.at - b.at;
  });

  // Denormalize entities into spans. Create a copy of the objects to leave
  // original Drafty object unchanged.
  spans = spans.map((s) => {
    let data;
    let tp = s.tp;
    if (!tp) {
      s.key = s.key || 0;
      if (ent[s.key]) {
        data = ent[s.key].data;
        tp = ent[s.key].tp;
      }
    }

    // Type still not defined? Hide invalid element.
    tp = tp || 'HD';

    return {
      tp: tp,
      data: data,
      at: s.at,
      len: s.len
    };
  });

  return forEach(txt, 0, txt.length, spans, formatter, context);
}

/**
 * Given structured representation of rich text, convert it to plain text.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to convert to plain text.
 */
Drafty.toPlainText = function(content) {
  return typeof content == 'string' ? content : content.txt;
}

/**
 * Returns true if content has no markup and no entities.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to check for presence of markup.
 * @returns true is content is plain text, false otherwise.
 */
Drafty.isPlainText = function(content) {
  return typeof content == 'string' || !(content.fmt || content.ent);
}

/**
 * Check if the drafty content has attachments.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - content to check for attachments.
 * @returns true if there are attachments.
 */
Drafty.hasAttachments = function(content) {
  if (content.ent && content.ent.length > 0) {
    for (var i in content.ent) {
      if (content.ent[i] && content.ent[i].tp == 'EX') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Callback for applying custom formatting/transformation to a Drafty object.
 * Called once for each syle span.
 * @memberof Drafty
 * @static
 *
 * @callback AttachmentCallback
 * @param {Object} data attachment data
 * @param {number} index attachment's index in `content.ent`.
 */

/**
 * Enumerate attachments.
 * @memberof Drafty
 * @static
 *
 * @param {Drafty} content - drafty object to process for attachments.
 * @param {AttachmentCallback} callback - callback to call for each attachment.
 * @param {Object} content - value of "this" for callback.
 */
Drafty.attachments = function(content, callback, context) {
  if (content.ent && content.ent.length > 0) {
    for (var i in content.ent) {
      if (content.ent[i] && content.ent[i].tp == 'EX') {
        callback.call(context, content.ent[i].data, i);
      }
    }
  }
}

/**
 * Given the entity, get URL which can be used for downloading
 * entity data.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 */
Drafty.getDownloadUrl = function(entData) {
  let url = null;
  if (entData.mime != JSON_MIME_TYPE && entData.val) {
    url = base64toObjectUrl(entData.val, entData.mime);
  } else if (typeof entData.ref == 'string') {
    url = entData.ref;
  }
  return url;
}

/**
 * Check if the entity data is being uploaded to the server.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 * @returns {boolean} true if upload is in progress, false otherwise.
 */
Drafty.isUploading = function(entData) {
  return entData.ref instanceof Promise;
}

/**
 * Given the entity, get URL which can be used for previewing
 * the entity.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the URl from.
 *
 * @returns {string} url for previewing or null if no such url is available.
 */
Drafty.getPreviewUrl = function(entData) {
  return entData.val ? base64toObjectUrl(entData.val, entData.mime) : null;
}

/**
 * Get approximate size of the entity.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the size for.
 */
Drafty.getEntitySize = function(entData) {
  // Either size hint or length of value. The value is base64 encoded,
  // the actual object size is smaller than the encoded length.
  return entData.size ? entData.size : entData.val ? (entData.val.length * 0.75) | 0 : 0;
}

/**
 * Get entity mime type.
 * @memberof Drafty
 * @static
 *
 * @param {Object} entity.data to get the type for.
 */
Drafty.getEntityMimeType = function(entData) {
  return entData.mime || 'text/plain';
}

/**
 * Get HTML tag for a given two-letter style name
 * @memberof Drafty
 * @static
 *
 * @param {string} style - two-letter style, like ST or LN
 *
 * @returns {string} tag name
 */
Drafty.tagName = function(style) {
  return HTML_TAGS[style] ? HTML_TAGS[style].name : undefined;
}

/**
 * For a given data bundle generate an object with HTML attributes,
 * for instance, given {url: "http://www.example.com/"} return
 * {href: "http://www.example.com/"}
 * @memberof Drafty
 * @static
 *
 * @param {string} style - tw-letter style to generate attributes for.
 * @param {Object} data - data bundle to convert to attributes
 *
 * @returns {Object} object with HTML attributes.
 */
Drafty.attrValue = function(style, data) {
  if (data && DECORATORS[style]) {
    return DECORATORS[style].props(data);
  }

  return undefined;
}

/**
 * Drafty MIME type.
 * @memberof Drafty
 * @static
 *
 * @returns {string} HTTP Content-Type "text/x-drafty".
 */
Drafty.getContentType = function() {
  return 'text/x-drafty';
}

if (typeof module != 'undefined') {
  module.exports = Drafty;
}
