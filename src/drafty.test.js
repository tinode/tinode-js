const Drafty = require('./drafty');

// Drafty.parse test data.
const parse_this = [
  [
    'This is *bold*, `code` and _italic_, ~strike~',
    {
      "fmt": [
        {"at": 8, "len": 4,"tp": "ST"},
        {"at": 14,"len": 4,"tp": "CO"},
        {"at": 23,"len": 6,"tp": "EM"},
        {"at": 31,"len": 6,"tp": "DL"},
      ],
      "txt": "This is bold, code and italic, strike",
    }
  ],
  [
    'Это *жЫрный*, `код` и _наклонный_, ~зачеркнутый~',
    {
      "fmt": [
        {"at": 4, "len": 6,"tp": "ST"},
        {"at": 12,"len": 3,"tp": "CO"},
        {"at": 18,"len": 9,"tp": "EM"},
        {"at": 29,"len": 11,"tp": "DL"},
      ],
      "txt": "Это жЫрный, код и наклонный, зачеркнутый",
    }
  ],
  [
    'combined *bold and _italic_*',
    {
      "fmt": [
        {"at": 18,"len": 6,"tp": "EM"},
        {"at": 9,"len": 15,"tp": "ST"},
      ],
      "txt": "combined bold and italic",
    }
  ],
  // FIXME: this test is inconsistent between golang, Android, and Javascript.
  [
    'This *text _has* staggered_ formats',
    {
      "fmt": [
        {"at": 5,"len": 9,"tp": "ST"},
      ],
      "txt": "This text _has staggered_ formats",
    },
  ],
  [
    'an url: https://www.example.com/abc#fragment and another _www.tinode.co_',
    {
      "ent": [
        {"data": {"url": "https://www.example.com/abc#fragment"},"tp": "LN"},
        {"data": {"url": "http://www.tinode.co"}, "tp": "LN"},
      ],
      "fmt": [
        {"at": 57,"len": 13,"tp": "EM"},
        {"at": 8,"len": 36,"key": 0},
        {"at": 57,"len": 13,"key": 1},
      ],
      "txt": "an url: https://www.example.com/abc#fragment and another www.tinode.co"
    },
  ],
  [
    'this is a @mention and a #hashtag in a string',
    {
      "ent": [
        {"data": {"val": "mention"}, "tp": "MN"},
        {"data": {"val": "hashtag"}, "tp": "HT"},
      ],
      "fmt": [
        {"at": 10, "key": 0, "len": 8},
        {"at": 25, "key": 1, "len": 8},
      ],
      "txt": "this is a @mention and a #hashtag in a string"
    },
  ],
  [
    'second #юникод',
    {
      "ent": [
        {"data": {"val": "юникод"},"tp": "HT"},
      ],
      "fmt": [
        {"at": 7, "key": 0, "len": 7},
      ],
      "txt": "second #юникод",
    },
  ],
];

test.each(parse_this)('Drafty.parse %s', (src, exp) => {
  expect(Drafty.parse(src)).toEqual(exp);
});

// Drafty docs for testing Drafty.preview.
const preview_this = [
  [
    "This is a plain text string.",
    {"txt":"This is a plain"},
  ],
  [
    {
      "txt":"This is a string with a line break.",
      "fmt":[{"at":9,"tp":"BR"}]
    },
    {
      "txt":"This is a strin",
      "fmt":[{"tp":"BR","len":0,"at":9}]
    },
  ],
  [
    {
      "ent":[{"data":{"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100, "height":80},"tp":"EX"}],
      "fmt":[{"at":-1}]
    },
    {
      "txt": "",
      "fmt":[{"at":-1,"key":0}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","name":"hello.jpg","width":100}}]
    },
  ],
  [
    {
      "ent":[{"data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},"tp":"LN"}],
      "fmt":[{"len":22}],
      "txt":"https://api.tinode.co/"
    },
    {
      "txt":"https://api.tin",
      "fmt":[{"at":0,"len":15,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}]
    },
  ],
  [
    {
      "ent":[{"data":{"url":"https://api.tinode.co/"},"tp":"LN"}],
      "fmt":[{"len":22}],
      "txt":"https://api.tinode.co/"
    },
    {
      "txt":"https://api.tin",
      "fmt":[{"at":0,"len":15,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"https://api.tinode.co/"}}]
    },
  ],
  [
    {
      "ent":[{"data":{"url":"http://tinode.co"},"tp":"LN"}],
      "fmt":[{"at":9,"len":3}, {"at":4,"len":3}],
      "txt":"Url one, two"
    },
    {
      "txt":"Url one, two",
      "fmt":[{"at":4,"len":3,"key":0},{"at":9,"len":3,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"http://tinode.co"}}]
    },
  ],
  [
    {
      "ent":[{"data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","val":"<38992, bytes: ...>","width":638},"tp":"IM"}],
      "fmt":[{"len":1}],
      "txt":" "
    },
    {
      "txt":" ",
      "fmt":[{"at":0,"len":1,"key":0}],
      "ent":[{"tp":"IM","data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","width":638}}]
    },
  ],
  [
    {
      "txt":"This text has staggered formats",
      "fmt":[{"at":5,"len":8,"tp":"EM"},{"at":10,"len":13,"tp":"ST"}]
    },
    {
      "txt":"This text has s",
      "fmt":[{"tp":"EM","at":5,"len":8}]
    },
  ],
  [
    {
      "txt":"This text is formatted and deleted too",
      "fmt":[{"at":5,"len":4,"tp":"ST"},{"at":13,"len":9,"tp":"EM"},{"at":35,"len":3,"tp":"ST"},{"at":27,"len":11,"tp":"DL"}]
    },
    {
      "txt":"This text is fo",
      "fmt":[{"tp":"ST","at":5,"len":4},{"tp":"EM","at":13,"len":2}]
    },
  ],
  [
    {
      "txt":"мультибайтовый юникод",
      "fmt":[{"len":14,"tp":"ST"},{"at":15,"len":6,"tp":"EM"}]
    },
    {
      "txt":"мультибайтовый ",
      "fmt":[{"at":0,"tp":"ST","len":14}]
    },
  ],
  [
    {
      "txt":"Alice Johnson    This is a test",
      "fmt":[{"at":13,"len":1,"tp":"BR"},{"at":15,"len":1},{"len":13,"key":1},{"len":16,"tp":"QQ"},{"at":16,"len":1,"tp":"BR"}],
      "ent":[{"tp":"IM","data":{"mime":"image/jpeg","val":"<1292, bytes: /9j/4AAQSkZJ...rehH5o6D/9k=>","width":25,"height":14,"size":968}},{"tp":"MN","data":{"color":2}}]
	},
    {
      "txt":"This is a test"
    },
  ],
  /*
  [
    {
      "txt":"Tino the Chatbot Post responseYesДа reply to a form",
      "ent":[{"tp":"IC","data":{"orig":"BN","name":"button"}},{"tp":"IC","data":{"orig":"BN","name":"button"}},{"tp":"MN","data":{"colorId":6}}],
      "fmt":[{"at":30,"len":3},{"at":33,"len":2,"key":1},{"len":16,"key":2}]
    },
    {
      "txt":"Tino the Chatbo",
      "fmt":[{"at":0,"len":15,"key":0}],
      "ent":[{"tp":"MN"}]
    },
  ]
  */
];

test.each(preview_this)('Drafty.preview %j', (src,exp) => {
  expect(Drafty.preview(src, 15)).toEqual(exp);
});
