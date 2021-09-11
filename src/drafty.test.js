const Drafty = require('./drafty');

// Drafty.parse test data.
const parse_this = [
  {
    src: 'This is *bold*, `code` and _italic_, ~strike~',
    expect: {
      "fmt": [
        {"at": 8, "len": 4,"tp": "ST"},
        {"at": 14,"len": 4,"tp": "CO"},
        {"at": 23,"len": 6,"tp": "EM"},
        {"at": 31,"len": 6,"tp": "DL"},
      ],
      "txt": "This is bold, code and italic, strike",
    }
  },
  {
    src: 'Это *жЫрный*, `код` и _наклонный_, ~зачеркнутый~',
    expect: {
      "fmt": [
        {"at": 4, "len": 6,"tp": "ST"},
        {"at": 12,"len": 3,"tp": "CO"},
        {"at": 18,"len": 9,"tp": "EM"},
        {"at": 29,"len": 11,"tp": "DL"},
      ],
      "txt": "Это жЫрный, код и наклонный, зачеркнутый",
    }
  },
  {
    src: 'combined *bold and _italic_*',
    expect: {
      "fmt": [
        {"at": 18,"len": 6,"tp": "EM"},
        {"at": 9,"len": 15,"tp": "ST"},
      ],
      "txt": "combined bold and italic",
    }
  },
  // FIXME: this test is inconsistent between golang, Android, and Javascript.
  {
    src: 'This *text _has* staggered_ formats',
    expect: {
      "fmt": [
        {"at": 5,"len": 9,"tp": "ST"},
      ],
      "txt": "This text _has staggered_ formats",
    },
  },
  {
    src: 'an url: https://www.example.com/abc#fragment and another _www.tinode.co_',
    expect: {
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
  },
  {
    src: 'this is a @mention and a #hashtag in a string',
    expect: {
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
  },
  {
    src: 'second #юникод',
    expect: {
      "ent": [
        {"data": {"val": "юникод"},"tp": "HT"},
      ],
      "fmt": [
        {"at": 7, "key": 0, "len": 7},
      ],
      "txt": "second #юникод",
    },
  },
];

test('Drafty.parse', () => {
  parse_this.forEach((x) => {
    expect(Drafty.parse(x.src)).toEqual(x.expect);
  });
});

// Drafty docs for testing Drafty.preview.
const preview_this = [
  {
    src: "This is a plain text string.",
    expect: {"txt":"This is a plain"},
  },
  {
    src: {
    "txt":"This is a string with a line break.",
    "fmt":[{"at":9,"tp":"BR"}]},
    expect: {"txt":"This is a strin","fmt":[{"tp":"BR","at":9}]},
  },
  {
    src: {
      "ent":[{"data":{"mime":"image/jpeg","name":"hello.jpg","val":"<38992, bytes: ...>","width":100, "height":80},"tp":"EX"}],
      "fmt":[{"at":-1, "key":0}]
    },
    expect: {"fmt":[{"at":-1}],"ent":[{"tp":"EX","data":{"height":80,"mime":"image/jpeg","name":"hello.jpg","width":100}}]},
  },
  {
    src: {
      "ent":[{"data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},"tp":"LN"}],
      "fmt":[{"len":22}],
      "txt":"https://api.tinode.co/"
    },
    expect: {"txt":"https://api.tin","fmt":[{"len":15}],"ent":[{"tp":"LN","data":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}]},
  },
  {
    src: {
      "ent":[{"data":{"url":"https://api.tinode.co/"},"tp":"LN"}],
      "fmt":[{"len":22}],
      "txt":"https://api.tinode.co/"
    },
    expect: {"txt":"https://api.tin","fmt":[{"len":15}],"ent":[{"tp":"LN","data":{"url":"https://api.tinode.co/"}}]},
  },
  {
    src: {
      "ent":[{"data":{"url":"http://tinode.co"},"tp":"LN"}],
      "fmt":[{"at":9,"len":3}, {"at":4,"len":3}],
      "txt":"Url one, two"
    },
    expect: {"txt":"Url one, two","fmt":[{"at":4,"len":3},{"at":9,"len":3}],"ent":[{"tp":"LN","data":{"url":"http://tinode.co"}}]},
  },
  {
    src: {
      "ent":[{"data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","val":"<38992, bytes: ...>","width":638},"tp":"IM"}],
      "fmt":[{"len":1}],
      "txt":" "
    },
    expect: {"txt":" ","fmt":[{"len":1}],"ent":[{"tp":"IM","data":{"height":213,"mime":"image/jpeg","name":"roses.jpg","width":638}}]},
  },
  {
    src: {
      "txt":"This text has staggered formats",
      "fmt":[{"at":5,"len":8,"tp":"EM"},{"at":10,"len":13,"tp":"ST"}]
    },
    expect: {"txt":"This text has s","fmt":[{"tp":"EM","at":5,"len":8}]},
  },
  {
    src: {
      "txt":"This text is formatted and deleted too",
      "fmt":[{"at":5,"len":4,"tp":"ST"},{"at":13,"len":9,"tp":"EM"},{"at":35,"len":3,"tp":"ST"},{"at":27,"len":11,"tp":"DL"}]
    },
    expect: {"txt":"This text is fo","fmt":[{"tp":"ST","at":5,"len":4},{"tp":"EM","at":13,"len":2}]},
  },
  {
    src: {
      "txt":"мультибайтовый юникод",
      "fmt":[{"len":14,"tp":"ST"},{"at":15,"len":6,"tp":"EM"}]
    },
    expect: {"txt":"мультибайтовый ","fmt":[{"tp":"ST","len":14}]},
  },
  {
    src: {
      "txt":"Alice Johnson    This is a test",
      "fmt":[{"at":13,"len":1,"tp":"BR"},{"at":15,"len":1},{"len":13,"key":1},{"len":16,"tp":"QQ"},{"at":16,"len":1,"tp":"BR"}],
      "ent":[{"tp":"IM","data":{"mime":"image/jpeg","val":"<1292, bytes: /9j/4AAQSkZJ...rehH5o6D/9k=>","width":25,"height":14,"size":968}},{"tp":"MN","data":{"color":2}}]
    },
    expect: {"txt":"Tino the Chatbo","fmt":[{"len":15}],"ent":[{"tp":"MN"}]},
  }
];

test('Drafty.preview', () => {
  preview_this.forEach((x) => {
    expect(Drafty.preview(x.src, 15)).toEqual(x.expect);
  });
});
