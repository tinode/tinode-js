const Drafty = require('./drafty');

// Drafty.parse test data.
const parse_this = [
  {
    src: 'This is *bold*, `code` and _italic_, ~strike~',
    expect: {
      "fmt": [
        {"at": 8, "len": 4, "tp": "ST"},
        {"at": 14,"len": 4, "tp": "CO"},
        {"at": 23,"len": 6,"tp": "EM"},
        {"at": 31,"len": 6,"tp": "DL"},
      ],
      "txt": "This is bold, code and italic, strike",
    }
  },
  {
    src: 'combined *bold and _italic_*',
    expect: {
      "fmt": [
        {"at": 18, "len": 6, "tp": "EM"},
        {"at": 9,"len": 15, "tp": "ST"},
      ],
      "txt": "combined bold and italic",
    }
  },
  {
    src: 'This *text _has* staggered_ formats',
    expect: {
      "fmt": [
        {"at": 5, "len": 9, "tp": "ST"},
      ],
      "txt": "This text has staggered formats",
    },
  },
  {
    src: 'an url: https://www.example.com/abc#fragment and another _www.tinode.co_',
    expect: {
      "ent": [
        {
          "data": {
            "url": "https://www.example.com/abc#fragment",
          },
          "tp": "LN"
        },
        {
          "data": {
            "url": "http://www.tinode.co",
          },
          "tp": "LN",
        },
      ],
      "fmt": [
        {"at": 57, "len": 13, "tp": "EM"},
        {"at": 8,"len": 36, "key": 0},
        {"at": 57,"len": 13, "key": 1},
      ],
      "txt": "an url: https://www.example.com/abc#fragment and another www.tinode.co"
    },
  },
  {
    src: 'this is a @mention and a #hashtag in a string',
    expect: {
      "ent": [
        {
          "data": {
            "val": "mention",
          },
          "tp": "MN",
        },
        {
          "data": {
            "val": "hashtag",
          },
          "tp": "HT",
        },
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
        {
          "data": {
            "val": "юникод",
          },
          "tp": "HT",
        },
      ],
      "fmt": [
        {"at": 7, "key": 0, "len": 7},
      ],
      "txt": "second #юникод",
    },
  },
];

test('Drafty.parse', () => {
  parse_this.map((x) => {
    expect(Drafty.parse(x.src)).toEqual(x.expect);
  });
});
