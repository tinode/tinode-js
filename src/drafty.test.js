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
    {"txt":"This is a plai…"},
    {"txt":"This is a plain text string."},
  ],
  [
    {
      "txt":"This is a string.", // Maybe remove extra space.
      "fmt":[{"at":9,"tp":"BR"}]
    },
    {"txt":"This is a  str…"},
    {"txt":"This is a string.","fmt":[{"at":9,len:0,"tp":"BR"}]},
  ],
  [
    {
      "txt":"This is a string.",
      "fmt":[{"at":true,"tp":"XX","len":{}}]
    },
    {"txt":"T"},
    {"txt":"This is a string."},
  ],
  [
    {
      "txt":"This is a string.",
      "fmt":[{"at":{},"tp":123,"len":null}]
    },
    {"txt":""},
    {"txt":"This is a string."},
  ],
  [
    {
      "txt":"This is a string.",
      "fmt":[{"test": 123},{"at":NaN,"tp":123,"len":-12}]
    },
    {"txt":"This is a stri…"},
    {"txt":"This is a string."},
  ],
  [
    {
      "fmt":[{"at":-1}],
      "ent":[{"data":{"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100, "height":80},"tp":"EX"}]
    },
    {
      "txt": " ",
      "fmt":[{"at":0,"key":0,"len":1}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","val":"<38992, bytes: ...>","name":"hello.jpg","width":100}}]
    },
    {
      "txt": "",
      "fmt":[{"at":-1,"key":0,"len":0}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","val":"<38992, bytes: ...>","name":"hello.jpg","width":100}}]
    },
  ],
  [
    {
      "fmt":[{"at":-100,"len":99}],
      "ent":[{"data":{"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100, "height":80},"tp":"EX"}]
    },
    {
      "txt": " ",
      "fmt":[{"at":0,"key":0,"len":1}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","val":"<38992, bytes: ...>","name":"hello.jpg","width":100}}]
    },
    {
      "txt": "",
      "fmt":[{"at":-1,"key":0,"len":0}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","val":"<38992, bytes: ...>","name":"hello.jpg","width":100}}]
    },
  ],
  [
    {
      "fmt":[{"at":-1, "key": "fake"}],
      "ent":[{"data":{"width":100},"tp":"EX"}]
    },
    {
      "txt": ""
    },
    {
      "txt": ""
    },
  ],
  [
    {
      "txt": "Message with attachment",
      "fmt":[{"at":-1,"len":0,"key":0},{"at":8,"len":4,"tp":"ST"}],
      "ent":[{"data":{"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100, "height":80},"tp":"EX"}]
    },
    {
      "txt": " Message with …",
      "fmt":[{"at":0,"len":1,"key":0},{"at":9,"len":4,"tp":"ST"}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100}}]
    },
    {
      "txt": "Message with attachment",
      "fmt":[{"at":8,"len":4,"tp":"ST"},{"at":-1,"len":0,"key":0}],
      "ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100}}]
    },
  ],
  [
    {
      "txt":"https://api.tinode.co/",
      "fmt":[{"len":22}],
      "ent":[{"data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},"tp":"LN"}]
    },
    {
      "txt":"https://api.ti…",
      "fmt":[{"at":0,"len":15,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}]
    },
    {
      "txt":"https://api.tinode.co/",
      "fmt":[{"at":0,"len":22,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}]
    },
  ],
  [
    {
      "txt":"https://api.tinode.co/",
      "fmt":[{"len":22}],
      "ent":[{"data":{"url":"https://api.tinode.co/"},"tp":"LN"}]
    },
    {
      "txt":"https://api.ti…",
      "fmt":[{"at":0,"len":15,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"https://api.tinode.co/"}}]
    },
    {
      "txt":"https://api.tinode.co/",
      "fmt":[{"at":0,"len":22,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"https://api.tinode.co/"}}]
    },
  ],
  [
    {
      "txt":"Url one, two",
      "fmt":[{"at":9,"len":3}, {"at":4,"len":3}],
      "ent":[{"data":{"url":"http://tinode.co"},"tp":"LN"}]
    },
    {
      "txt":"Url one, two",
      "fmt":[{"at":4,"len":3,"key":0},{"at":9,"len":3,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"http://tinode.co"}}]
    },
    {
      "txt":"Url one, two",
      "fmt":[{"at":4,"len":3,"key":0},{"at":9,"len":3,"key":0}],
      "ent":[{"tp":"LN","data":{"url":"http://tinode.co"}}]
    },
  ],
  [
    {
      "txt":"Url one, two",
      "fmt":[{"at":9,"len":3,"key":0},{"at":4,"len":3,"key":1}],
      "ent":[{"data":{"url":"http://tinode.co"},"tp":"LN"}, {"data":{"url":"http://example.com"},"tp":"LN"}]
    },
    {
      "txt":"Url one, two",
      "fmt":[{"at":4,"len":3,"key":0},{"at":9,"len":3,"key":1}],
      "ent":[{"data":{"url":"http://example.com"},"tp":"LN"}, {"data":{"url":"http://tinode.co"},"tp":"LN"}]
    },
    {
      "txt":"Url one, two",
      "fmt":[{"at":4,"len":3,"key":0},{"at":9,"len":3,"key":1}],
      "ent":[{"data":{"url":"http://example.com"},"tp":"LN"}, {"data":{"url":"http://tinode.co"},"tp":"LN"}]
    },
  ],
  [
    {
      "txt":" ",
      "fmt":[{"len":1}],
      "ent":[{"data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","val":"<38992, bytes: ...>","width":638},"tp":"IM"}]
    },
    {
      "txt":" ",
      "fmt":[{"at":0,"len":1,"key":0}],
      "ent":[{"tp":"IM","data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","val":"<38992, bytes: ...>","width":638}}]
    },
    {
      "txt":" ",
      "fmt":[{"at":0,"len":1,"key":0}],
      "ent":[{"tp":"IM","data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","val":"<38992, bytes: ...>","width":638}}]
    },
  ],
  [
    {
      "txt":"This text has staggered formats",
      "fmt":[{"at":5,"len":8,"tp":"EM"},{"at":10,"len":13,"tp":"ST"}]
    },
    {
      "txt":"This text has …",
      "fmt":[{"tp":"EM","at":5,"len":8}]
    },
    {
      "txt":"This text has staggered formats",
      "fmt":[{"tp":"EM","at":5,"len":8}]
    },
  ],
  [
    {
      "txt":"This text is formatted and deleted too",
      "fmt":[{"at":5,"len":4,"tp":"ST"},{"at":13,"len":9,"tp":"EM"},{"at":35,"len":3,"tp":"ST"},{"at":27,"len":11,"tp":"DL"}]
    },
    {
      "txt":"This text is f…",
      "fmt":[{"tp":"ST","at":5,"len":4},{"tp":"EM","at":13,"len":2}]
    },
    {
      "txt":"This text is formatted and deleted too",
      "fmt":[{"tp":"ST","at":5,"len":4},{"tp":"EM","at":13,"len":9},{"at":35,"len":3,"tp":"ST"},{"at":27,"len":11,"tp":"DL"}]
    },
  ],
  [
    {
      "txt":"мультибайтовый юникод",
      "fmt":[{"len":14,"tp":"ST"},{"at":15,"len":6,"tp":"EM"}]
    },
    {
      "txt":"мультибайтовый…",
      "fmt":[{"at":0,"tp":"ST","len":14}]
    },
    {
      "txt":"мультибайтовый юникод",
      "fmt":[{"at":0,"len":14,"tp":"ST"},{"at":15,"len":6,"tp":"EM"}]
    },
  ],
  [
    {
      "txt":"Alice Johnson    This is a test",
      "fmt":[{"at":13,"len":1,"tp":"BR"},{"at":15,"len":1},{"len":13,"key":1},{"len":16,"tp":"QQ"},{"at":16,"len":1,"tp":"BR"}],
      "ent":[{"tp":"IM","data":{"mime":"image/jpeg","val":"<1292, bytes: /9j/4AAQSkZJ...rehH5o6D/9k=>","width":25,"height":14,"size":968}},{"tp":"MN","data":{"uid":"usr123abcDE"}}]
    },
    {
      "txt":"This is a test"
    },
    {
      "txt":"Alice Johnson    This is a test",
      "fmt":[{"at":0,"len":13,"key":0},{"at":13,"len":1,"tp":"BR"},{"at":15,"len":1,"key":1},{"at":0,"len":16,"tp":"QQ"},{"at":16,"len":1,"tp":"BR"}],
      "ent":[
        {"tp":"MN","data":{"uid":"usr123abcDE"}},
        {"tp":"IM", "data":{"mime":"image/jpeg","val":"<1292, bytes: /9j/4AAQSkZJ...rehH5o6D/9k=>","width":25,"height":14,"size":968}}
      ]
    },
  ],
];

test.each(preview_this)('Drafty.normalize %j', (src,_,exp) => {
  expect(Drafty.normalize(src)).toEqual(exp);
});

test.each(preview_this)('Drafty.preview %j', (src,exp,_) => {
  expect(Drafty.preview(src, 15)).toEqual(exp);
});
