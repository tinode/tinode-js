import * as Drafty from './drafty';

// Drafty.parse test data.
const parse_this = [
  [
    'This is *bold*, `code` and _italic_, ~strike~',
    {
      "fmt": [{
          "at": 8,
          "len": 4,
          "tp": "ST"
        },
        {
          "at": 14,
          "len": 4,
          "tp": "CO"
        },
        {
          "at": 23,
          "len": 6,
          "tp": "EM"
        },
        {
          "at": 31,
          "len": 6,
          "tp": "DL"
        },
      ],
      "txt": "This is bold, code and italic, strike",
    }
  ],
  [
    'Это *жЫрный*, `код` и _наклонный_, ~зачеркнутый~',
    {
      "fmt": [{
          "at": 4,
          "len": 6,
          "tp": "ST"
        },
        {
          "at": 12,
          "len": 3,
          "tp": "CO"
        },
        {
          "at": 18,
          "len": 9,
          "tp": "EM"
        },
        {
          "at": 29,
          "len": 11,
          "tp": "DL"
        },
      ],
      "txt": "Это жЫрный, код и наклонный, зачеркнутый",
    }
  ],
  [
    'combined *bold and _italic_*',
    {
      "fmt": [{
          "at": 18,
          "len": 6,
          "tp": "EM"
        },
        {
          "at": 9,
          "len": 15,
          "tp": "ST"
        },
      ],
      "txt": "combined bold and italic",
    }
  ],
  // FIXME: this test is inconsistent between golang, Android, and Javascript.
  [
    'This *text _has* staggered_ formats',
    {
      "fmt": [{
        "at": 5,
        "len": 9,
        "tp": "ST"
      }, ],
      "txt": "This text _has staggered_ formats",
    },
  ],
  [
    'an url: https://www.example.com/abc#fragment and another _www.tinode.co_',
    {
      "ent": [{
          "data": {
            "url": "https://www.example.com/abc#fragment"
          },
          "tp": "LN"
        },
        {
          "data": {
            "url": "http://www.tinode.co"
          },
          "tp": "LN"
        },
      ],
      "fmt": [{
          "at": 57,
          "len": 13,
          "tp": "EM"
        },
        {
          "at": 8,
          "len": 36,
          "key": 0
        },
        {
          "at": 57,
          "len": 13,
          "key": 1
        },
      ],
      "txt": "an url: https://www.example.com/abc#fragment and another www.tinode.co"
    },
  ],
  [
    'this is a @mention and a #hashtag in a string',
    {
      "ent": [{
          "data": {
            "val": "mention"
          },
          "tp": "MN"
        },
        {
          "data": {
            "val": "hashtag"
          },
          "tp": "HT"
        },
      ],
      "fmt": [{
          "at": 10,
          "key": 0,
          "len": 8
        },
        {
          "at": 25,
          "key": 1,
          "len": 8
        },
      ],
      "txt": "this is a @mention and a #hashtag in a string"
    },
  ],
  [
    'second #юникод',
    {
      "ent": [{
        "data": {
          "val": "юникод"
        },
        "tp": "HT"
      }, ],
      "fmt": [{
        "at": 7,
        "key": 0,
        "len": 7
      }, ],
      "txt": "second #юникод",
    },
  ],
];

test.each(parse_this)('Drafty.parse %s', (src, exp) => {
  expect(Drafty.parse(src)).toEqual(exp);
});

// Drafty docs for testing Drafty.preview and Drafty.normalize.
const shorten_this = [
  [
    "This is a plain text string.",
    {
      "txt": "This is a plai…"
    },
  ],
  [{
      "txt": "This is a string.", // Maybe remove extra space.
      "fmt": [{
        "at": 9,
        "tp": "BR"
      }]
    },
    {
      "txt": "This is a stri…",
      "fmt": [{
        "at": 9,
        len: 0,
        "tp": "BR"
      }]
    },
  ],
  [{
      "txt": "This is a string.",
      "fmt": [{
        "at": true,
        "tp": "XX",
        "len": {}
      }]
    },
    {
      "txt": "This is a stri…"
    },
  ],
  [{
      "txt": "This is a string.",
      "fmt": [{
        "at": {},
        "tp": 123,
        "len": null
      }]
    },
    {
      "txt": "This is a stri…"
    },
  ],
  [{
      "txt": "This is a string.",
      "fmt": [{
        "test": 123
      }, {
        "at": NaN,
        "tp": 123,
        "len": -12
      }]
    },
    {
      "txt": "This is a stri…"
    },
  ],
  [{
      "fmt": [{
        "at": -1
      }],
      "ent": [{
        "data": {
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 100,
          "height": 80
        },
        "tp": "EX"
      }]
    },
    {
      "txt": "",
      "fmt": [{
        "at": -1,
        "key": 0,
        "len": 0
      }],
      "ent": [{
        "tp": "EX",
        "data": {
          "height": 80,
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "width": 100
        }
      }]
    },
  ],
  [{
      "fmt": [{
        "at": -100,
        "len": 99
      }],
      "ent": [{
        "data": {
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 100,
          "height": 80
        },
        "tp": "EX"
      }]
    },
    {
      "txt": "",
      "fmt": [{
        "at": -1,
        "key": 0,
        "len": 0
      }],
      "ent": [{
        "tp": "EX",
        "data": {
          "height": 80,
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "width": 100
        }
      }]
    },
  ],
  [{
      "fmt": [{
        "at": -1,
        "key": "fake"
      }],
      "ent": [{
        "data": {
          "width": 100
        },
        "tp": "EX"
      }]
    },
    {
      "txt": ""
    },
  ],
  [{
      "txt": "Message with attachment",
      "fmt": [{
        "at": -1,
        "len": 0,
        "key": 0
      }, {
        "at": 8,
        "len": 4,
        "tp": "ST"
      }],
      "ent": [{
        "data": {
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 100,
          "height": 80
        },
        "tp": "EX"
      }]
    },
    {
      "txt": "Message with a…",
      "fmt": [{
        "at": 8,
        "len": 4,
        "tp": "ST"
      }, {
        "at": -1,
        "len": 0,
        "key": 0
      }],
      "ent": [{
        "tp": "EX",
        "data": {
          "height": 80,
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "width": 100
        }
      }]
    },
  ],
  [{
      "txt": "https://api.tinode.co/",
      "fmt": [{
        "len": 22
      }],
      "ent": [{
        "data": {
          "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        "tp": "LN"
      }]
    },
    {
      "txt": "https://api.ti…",
      "fmt": [{
        "at": 0,
        "len": 15,
        "key": 0
      }],
      "ent": [{
        "tp": "LN",
        "data": {
          "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      }]
    },
  ],
  [{
      "txt": "https://api.tinode.co/",
      "fmt": [{
        "len": 22
      }],
      "ent": [{
        "data": {
          "url": "https://api.tinode.co/"
        },
        "tp": "LN"
      }]
    },
    {
      "txt": "https://api.ti…",
      "fmt": [{
        "at": 0,
        "len": 15,
        "key": 0
      }],
      "ent": [{
        "tp": "LN",
        "data": {
          "url": "https://api.tinode.co/"
        }
      }]
    },
  ],
  [{
      "txt": "Url one, two",
      "fmt": [{
        "at": 9,
        "len": 3
      }, {
        "at": 4,
        "len": 3
      }],
      "ent": [{
        "data": {
          "url": "http://tinode.co"
        },
        "tp": "LN"
      }]
    },
    {
      "txt": "Url one, two",
      "fmt": [{
        "at": 4,
        "len": 3,
        "key": 0
      }, {
        "at": 9,
        "len": 3,
        "key": 0
      }],
      "ent": [{
        "tp": "LN",
        "data": {
          "url": "http://tinode.co"
        }
      }]
    },
  ],
  [{
      "txt": "Url one, two",
      "fmt": [{
        "at": 9,
        "len": 3,
        "key": 0
      }, {
        "at": 4,
        "len": 3,
        "key": 1
      }],
      "ent": [{
        "data": {
          "url": "http://tinode.co"
        },
        "tp": "LN"
      }, {
        "data": {
          "url": "http://example.com"
        },
        "tp": "LN"
      }]
    },
    {
      "txt": "Url one, two",
      "fmt": [{
        "at": 4,
        "len": 3,
        "key": 0
      }, {
        "at": 9,
        "len": 3,
        "key": 1
      }],
      "ent": [{
        "data": {
          "url": "http://example.com"
        },
        "tp": "LN"
      }, {
        "data": {
          "url": "http://tinode.co"
        },
        "tp": "LN"
      }]
    },
  ],
  [{
      "txt": " ",
      "fmt": [{
        "len": 1
      }],
      "ent": [{
        "data": {
          "height": 213,
          "mime": "image/jpeg",
          "name": "roses.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 638
        },
        "tp": "IM"
      }]
    },
    {
      "txt": " ",
      "fmt": [{
        "at": 0,
        "len": 1,
        "key": 0
      }],
      "ent": [{
        "tp": "IM",
        "data": {
          "height": 213,
          "mime": "image/jpeg",
          "name": "roses.jpg",
          "width": 638
        }
      }]
    },
  ],
  [{
      "txt": "This text has staggered formats",
      "fmt": [{
        "at": 5,
        "len": 8,
        "tp": "EM"
      }, {
        "at": 10,
        "len": 13,
        "tp": "ST"
      }]
    },
    {
      "txt": "This text has …",
      "fmt": [{
        "tp": "EM",
        "at": 5,
        "len": 8
      }]
    },
  ],
  [{
      "txt": "This text is formatted and deleted too",
      "fmt": [{
        "at": 5,
        "len": 4,
        "tp": "ST"
      }, {
        "at": 13,
        "len": 9,
        "tp": "EM"
      }, {
        "at": 35,
        "len": 3,
        "tp": "ST"
      }, {
        "at": 27,
        "len": 11,
        "tp": "DL"
      }]
    },
    {
      "txt": "This text is f…",
      "fmt": [{
        "tp": "ST",
        "at": 5,
        "len": 4
      }, {
        "tp": "EM",
        "at": 13,
        "len": 2
      }]
    },
  ],
  [{
      "txt": "мультибайтовый юникод",
      "fmt": [{
        "len": 14,
        "tp": "ST"
      }, {
        "at": 15,
        "len": 6,
        "tp": "EM"
      }]
    },
    {
      "txt": "мультибайтовый…",
      "fmt": [{
        "at": 0,
        "tp": "ST",
        "len": 14
      }]
    },
  ],
  [{
      "txt": "Alice Johnson    This is a test",
      "fmt": [{
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 15,
        "len": 1
      }, {
        "len": 13,
        "key": 1
      }, {
        "len": 16,
        "tp": "QQ"
      }, {
        "at": 16,
        "len": 1,
        "tp": "BR"
      }],
      "ent": [{
        "tp": "IM",
        "data": {
          "mime": "image/jpeg",
          "val": "<1292, bytes: /9j/4AAQSkZJ123456789012345678901234567890123456789012345678901234567890rehH5o6D/9k=>",
          "width": 25,
          "height": 14,
          "size": 968
        }
      }, {
        "tp": "MN",
        "data": {
          "val": "usr123abcDE"
        }
      }]
    },
    {
      "txt": "Alice Johnson …",
      "fmt": [{
        "at": 0,
        "len": 13,
        "key": 0
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 0,
        "len": 15,
        "tp": "QQ"
      }],
      "ent": [{
        "tp": "MN",
        "data": {
          "val": "usr123abcDE"
        }
      }, ]
    },
  ],
  [{
      "txt": "a😀c😀d😀e😀f😀g😀h😀i😀j😀k😀l😀m"
    },
    {
      "txt": "a😀c😀d😀e😀f😀g😀h😀…",
    }
  ],
  [{
      "txt": "😀 b1👩🏽‍✈️b2 smile 123 123 123 123",
      "fmt": [{
        "tp": "ST",
        "at": 2,
        "len": 8
      }, {
        "tp": "EM",
        "at": 0,
        "len": 20
      }]
    },
    {
      "txt": "😀 b1👩🏽‍✈️b2 smile 123 1…",
      "fmt": [{
        "tp": "ST",
        "at": 2,
        "len": 8
      }, {
        "tp": "EM",
        "at": 0,
        "len": 15
      }]
    },
  ]
];

test.each(shorten_this)('Drafty.shorten %j', (src, exp) => {
  expect(Drafty.shorten(src, 15, true)).toEqual(exp);
});

// Drafty docs for testing Drafty.forwardedContent.
const forward_this = [
  [{
      "txt": " ",
      "fmt": [{
        "len": 1
      }],
      "ent": [{
        "data": {
          "height": 213,
          "mime": "image/jpeg",
          "name": "roses.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 638
        },
        "tp": "IM"
      }]
    },
    {
      "txt": " ",
      "fmt": [{
        "at": 0,
        "len": 1,
        "key": 0
      }],
      "ent": [{
        "tp": "IM",
        "data": {
          "height": 213,
          "mime": "image/jpeg",
          "name": "roses.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 638
        }
      }]
    },
  ],
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 13
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "len": 38,
        "tp": "QQ"
      }],
      "txt": "Alice Johnson This is a reply to replyThis is a Reply -> Forward -> Reply."
    },
    {
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "at": 0,
        "len": 13,
        "key": 0
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 0,
        "len": 38,
        "tp": "QQ"
      }],
      "txt": "Alice Johnson This is a reply to replyThis is a Reply -> Forward -> Reply."
    },
  ],
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }, {
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 15
      }, {
        "at": 15,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "key": 1,
        "len": 13
      }, {
        "at": 29,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "len": 36,
        "tp": "QQ"
      }],
      "txt": "➦ Alice Johnson Alice Johnson This is a simple replyThis is a reply to reply"
    },
    {
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "at": 0,
        "key": 0,
        "len": 13
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 0,
        "len": 36,
        "tp": "QQ"
      }],
      "txt": "Alice Johnson This is a simple replyThis is a reply to reply"
    }
  ],
];

test.each(forward_this)('Drafty.forwardedContent %j', (src, exp) => {
  expect(Drafty.forwardedContent(src)).toEqual(exp);
});

// Drafty docs for testing Drafty.preview.
const preview_this = [
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 13
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "len": 38,
        "tp": "QQ"
      }],
      "txt": "Alice Johnson This is a reply to replyThis is a Reply -> Forward -> Reply."
    },
    {
      "fmt": [{
        "at": 0,
        "len": 1,
        "tp": "QQ"
      }],
      "txt": " This is a Reply -> Forw…"
    },
  ],
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }, {
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 15
      }, {
        "at": 15,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "key": 1,
        "len": 13
      }, {
        "at": 29,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "len": 36,
        "tp": "QQ"
      }],
      "txt": "➦ Alice Johnson Alice Johnson This is a simple replyThis is a reply to reply"
    },
    {
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "at": 0,
        "key": 0,
        "len": 1
      }, {
        "at": 2,
        "len": 1,
        "tp": "QQ"
      }],
      "txt": "➦  This is a reply to re…"
    }
  ],
];

test.each(preview_this)('Drafty.preview %j', (src, exp) => {
  expect(Drafty.preview(src, 25)).toEqual(exp);
});

// Drafty docs for testing Drafty.replyContent.
const reply_this = [
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 13
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "len": 38,
        "tp": "QQ"
      }],
      "txt": "Alice Johnson This is a reply to replyThis is a Reply -> Forward -> Reply."
    },
    {
      "txt": "This is a Reply -> Forwa…"
    },
  ],
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }, {
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 15
      }, {
        "at": 15,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "key": 1,
        "len": 13
      }, {
        "at": 29,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "len": 36,
        "tp": "QQ"
      }],
      "txt": "➦ Alice Johnson Alice Johnson This is a simple replyThis is a reply to reply"
    },
    {
      "fmt": [{
        "at": 0,
        "tp": "MN",
        "len": 1
      }],
      "txt": "➦ This is a reply to rep…"
    }
  ],
  [{
      "txt": "Message with attachment",
      "fmt": [{
        "at": -1,
        "len": 0,
        "key": 0
      }, {
        "at": 8,
        "len": 4,
        "tp": "ST"
      }],
      "ent": [{
        "data": {
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 100,
          "height": 80
        },
        "tp": "EX"
      }]
    },
    {
      "txt": "Message with attachment ",
      "fmt": [{
        "at": 8,
        "len": 4,
        "tp": "ST"
      }, {
        "at": 23,
        "len": 1,
        "key": 0
      }],
      "ent": [{
        "data": {
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "width": 100,
          "height": 80
        },
        "tp": "EX"
      }]
    }
  ],
  [{
      "fmt": [{
        "at": -1
      }],
      "ent": [{
        "data": {
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 100,
          "height": 80
        },
        "tp": "EX"
      }]
    },
    {
      "txt": " ",
      "fmt": [{
        "at": 0,
        "key": 0,
        "len": 1
      }],
      "ent": [{
        "tp": "EX",
        "data": {
          "height": 80,
          "mime": "image/jpeg",
          "name": "hello.jpg",
          "width": 100
        }
      }]
    },
  ],
  [{
      "txt": " ",
      "fmt": [{
        "len": 1
      }],
      "ent": [{
        "data": {
          "height": 213,
          "mime": "image/jpeg",
          "name": "roses.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 638
        },
        "tp": "IM"
      }]
    },
    {
      "txt": " ",
      "fmt": [{
        "at": 0,
        "len": 1,
        "key": 0
      }],
      "ent": [{
        "tp": "IM",
        "data": {
          "height": 213,
          "mime": "image/jpeg",
          "name": "roses.jpg",
          "val": "<38992, bytes: 123456789012345678901234567890123456789012345678901234567890>",
          "width": 638
        }
      }]
    },
  ],
];

test.each(reply_this)('Drafty.replyContent %j', (src, exp) => {
  expect(Drafty.replyContent(src, 25)).toEqual(exp);
});

// Drafty docs for testing Drafty.replyContent.
const format_this = [
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 13
      }, {
        "at": 13,
        "len": 1,
        "tp": "BR"
      }, {
        "len": 38,
        "tp": "QQ"
      }],
      "txt": "Alice Johnson This is a reply to replyThis is a Reply -> Forward -> Reply."
    },
    "<div><a href=\"#usrCPvFc6lpAsw\">Alice Johnson</a><br/> This is a reply to reply</div>This is a Reply -> Forward -> Reply.",
  ],
  [{
      "ent": [{
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }, {
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 15
      }, {
        "at": 15,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "key": 1,
        "len": 13
      }, {
        "at": 29,
        "len": 1,
        "tp": "BR"
      }, {
        "at": 16,
        "len": 36,
        "tp": "QQ"
      }],
      "txt": "➦ Alice Johnson Alice Johnson This is a simple replyThis is a reply to reply"
    },
    "<a href=\"#usrCPvFc6lpAsw\">➦ Alice Johnson</a><br/> <div><a href=\"#usrCPvFc6lpAsw\">Alice Johnson</a><br/> This is a simple reply</div>This is a reply to reply"
  ],
];

test.each(format_this)('Drafty.UNSAFE_toHTML %j', (src, exp) => {
  expect(Drafty.UNSAFE_toHTML(src)).toEqual(exp);
});

// Test for handling invalid Drafty.
const invalid_this = [
  [{
      "fmt": [null, {
        "at": 5,
        "len": 5,
        "tp": "EM"
      }],
      "txt": "Null style in the middle"
    },
    "Null <i>style</i> in the middle",
  ],
  [{
      "ent": [null, {
        "data": {
          "val": "usrCPvFc6lpAsw"
        },
        "tp": "MN"
      }],
      "fmt": [{
        "len": 4
      }, {
        "at": 5,
        "key": 1,
        "len": 6
      }],
      "txt": "Null entity with reference"
    },
    "Null <a href=\"#usrCPvFc6lpAsw\">entity</a> with reference"
  ],
];

test.each(invalid_this)('Invalid Drafty %j', (src, exp) => {
  expect(Drafty.UNSAFE_toHTML(src)).toEqual(exp);
});
