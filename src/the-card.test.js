import TheCard from './the-card';

import {
  DEL_CHAR
} from './config.js';

describe('TheCard', () => {

  describe('constructor', () => {
    test('should create empty card', () => {
      const card = new TheCard().getCard();
      expect(card || {}).toEqual({});
    });

    test('should create card with fn', () => {
      const card = new TheCard('Alice').getCard();
      expect(card).toEqual({
        fn: 'Alice'
      });
    });

    test('should create card with all fields', () => {
      const card = new TheCard('Alice', 'http://example.com/img.jpg', 'image/jpeg', 'Note').getCard();
      expect(card).toEqual({
        fn: 'Alice',
        note: 'Note',
        photo: {
          ref: 'http://example.com/img.jpg',
          type: 'jpeg',
          data: '␡'
        }
      });
    });
  });

  describe('setFn', () => {
    test('should set fn', () => {
      const card = TheCard.setFn({}, 'Bob');
      expect(card.fn).toBe('Bob');
    });

    test('should trim fn', () => {
      const card = TheCard.setFn({}, '  Bob  ');
      expect(card.fn).toBe('Bob');
    });

    test('should remove fn if empty', () => {
      // Assuming setFn removes the property if empty
      const card = TheCard.setFn({
        fn: 'Bob'
      }, '');
      expect(card.fn).toBeUndefined();
    });
  });

  describe('getFn', () => {
    test('should get fn from card', () => {
      const card = {
        fn: 'Charlie'
      };
      expect(TheCard.getFn(card)).toBe('Charlie');
    });

    test('should return null if fn is missing', () => {
      const card = {
        note: 'Some note'
      };
      expect(TheCard.getFn(card)).toBeNull();
    });

    test('should return null if card is null', () => {
      expect(TheCard.getFn(null)).toBeNull();
    });

    test('should return null if card is undefined', () => {
      expect(TheCard.getFn(undefined)).toBeNull();
    });
  });

  describe('setNote', () => {
    test('should set note', () => {
      const card = TheCard.setNote({}, 'My Note');
      expect(card.note).toBe('My Note');
    });

    test('should set DEL_CHAR if empty', () => {
      const card = TheCard.setNote({
        note: 'Old'
      }, '');
      expect(card.note).toBe(DEL_CHAR);
    });
  });

  describe('setPhoto', () => {
    test('should set photo from ref', () => {
      const card = TheCard.setPhoto({}, 'http://example.com/a.png', 'image/png');
      expect(card.photo).toEqual({
        ref: 'http://example.com/a.png',
        type: 'png',
        data: '␡'
      });
    });

    test('should set photo from data URI', () => {
      // The function expects a Data URI string to populate the 'data' field.
      const dataUri = 'data:image/png;base64,AQID';
      const card = TheCard.setPhoto({}, dataUri, 'image/png');
      expect(card.photo).toEqual({
        data: 'AQID',
        type: 'png',
        ref: DEL_CHAR
      });
    });

    test('should set DEL_CHAR if null', () => {
      const card = TheCard.setPhoto({
        photo: {}
      }, null);
      expect(card.photo).toBe(DEL_CHAR);
    });

    test('should infer mime type from extension', () => {
      const card = TheCard.setPhoto({}, 'http://example.com/a.jpg');
      expect(card.photo).toEqual({
        ref: 'http://example.com/a.jpg',
        type: 'jpeg',
        data: DEL_CHAR
      });
    });

    test('should infer mime type from data URI', () => {
      const dataUri = 'data:image/gif;base64,AQID';
      const card = TheCard.setPhoto({}, dataUri);
      expect(card.photo).toEqual({
        data: 'AQID',
        type: 'gif',
        ref: DEL_CHAR
      });
    });

    test('should use default mime type if unknown', () => {
      const card = TheCard.setPhoto({}, 'http://example.com/a.unknown');
      expect(card.photo).toEqual({
        ref: 'http://example.com/a.unknown',
        type: 'jpeg',
        data: DEL_CHAR
      });
    });
  });

  describe('getPhotoUrl', () => {
    test('should return null if no photo', () => {
      expect(TheCard.getPhotoUrl({})).toBeNull();
    });

    test('should return ref url', () => {
      const card = {
        photo: {
          ref: 'http://example.com/a.png',
          type: 'png'
        }
      };
      expect(TheCard.getPhotoUrl(card)).toBe('http://example.com/a.png');
    });

    test('should return data uri', () => {
      const card = {
        photo: {
          data: 'AQID',
          type: 'png'
        }
      };
      expect(TheCard.getPhotoUrl(card)).toBe('data:image/png;base64,AQID');
    });

    test('should handle missing type in data uri', () => {
      const card = {
        photo: {
          data: 'AQID'
        }
      };
      expect(TheCard.getPhotoUrl(card)).toBe('data:image/jpeg;base64,AQID');
    });
  });

  describe('Communication channels', () => {
    test('addPhone', () => {
      let card = {};
      card = TheCard.addPhone(card, '1234567890', 'mobile');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: '1234567890',
        des: ['mobile'],
        proto: 'tel'
      });
    });

    test('setPhone (replace)', () => {
      let card = {
        comm: [{
          value: '000',
          des: ['work'],
          proto: 'tel'
        }]
      };
      card = TheCard.setPhone(card, '1234567890', 'work');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: '1234567890',
        des: ['work'],
        proto: 'tel'
      });
    });

    test('addEmail', () => {
      let card = {};
      card = TheCard.addEmail(card, 'bob@example.com', 'work');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'bob@example.com',
        des: ['work'],
        proto: 'email'
      });
    });

    test('addTinodeID', () => {
      let card = {};
      card = TheCard.addTinodeID(card, 'usr123', 'home');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'usr123',
        des: ['home'],
        proto: 'tinode'
      });
    });

    test('clearPhone', () => {
      let card = {
        comm: [{
            value: '123',
            des: ['mobile'],
            proto: 'tel'
          },
          {
            value: '456',
            des: ['work'],
            proto: 'tel'
          }
        ]
      };
      card = TheCard.clearPhone(card, '123', 'mobile');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0].value).toBe('456');
    });

    test('setEmail', () => {
      let card = {
        comm: [{
          value: 'old@example.com',
          des: ['work'],
          proto: 'email'
        }]
      };
      card = TheCard.setEmail(card, 'new@example.com', 'work');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'new@example.com',
        des: ['work'],
        proto: 'email'
      });
    });

    test('setTinodeID', () => {
      let card = {
        comm: [{
          value: 'usr111',
          des: ['home'],
          proto: 'tinode'
        }]
      };
      card = TheCard.setTinodeID(card, 'usr222', 'home');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'usr222',
        des: ['home'],
        proto: 'tinode'
      });
    });

    test('clearEmail', () => {
      let card = {
        comm: [{
          value: 'a@example.com',
          des: ['home'],
          proto: 'email'
        }, {
          value: 'b@example.com',
          des: ['work'],
          proto: 'email'
        }]
      };
      card = TheCard.clearEmail(card, 'a@example.com', 'home');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0].value).toBe('b@example.com');
    });

    test('clearTinodeID', () => {
      let card = {
        comm: [{
          value: 'usr1',
          des: ['home'],
          proto: 'tinode'
        }, {
          value: 'usr2',
          des: ['work'],
          proto: 'tinode'
        }]
      };
      card = TheCard.clearTinodeID(card, 'usr1', 'home');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0].value).toBe('usr2');
    });
  });

  describe('exportVCard', () => {
    test('should return null for empty card', () => {
      expect(TheCard.exportVCard(null)).toBeNull();
    });

    test('should export minimal card', () => {
      const card = {
        fn: 'Alice'
      };
      const vcard = TheCard.exportVCard(card);
      expect(vcard).toContain('BEGIN:VCARD');
      expect(vcard).toContain('VERSION:3.0');
      expect(vcard).toContain('FN:Alice');
      expect(vcard).toContain('END:VCARD');
    });

    test('should export full card', () => {
      const card = {
        fn: 'Alice',
        note: 'My Note',
        photo: {
          type: 'jpeg',
          data: 'base64data',
          ref: DEL_CHAR
        },
        comm: [{
            proto: 'tel',
            des: ['cell'],
            value: '123456'
          },
          {
            proto: 'email',
            des: ['home'],
            value: 'alice@example.com'
          },
          {
            proto: 'tinode',
            des: ['home'],
            value: 'usr123'
          },
          {
            proto: 'http',
            des: ['work'],
            value: 'https://example.com'
          }
        ]
      };
      const vcard = TheCard.exportVCard(card);
      expect(vcard).toContain('FN:Alice');
      expect(vcard).toContain('NOTE:My Note');
      expect(vcard).toContain('PHOTO;TYPE=JPEG;ENCODING=b:base64data');
      expect(vcard).toContain('TEL;TYPE=CELL:123456');
      expect(vcard).toContain('EMAIL;TYPE=HOME:alice@example.com');
      expect(vcard).toContain('IMPP;TYPE=HOME;tinode:usr123');
      expect(vcard).toContain('URL;TYPE=WORK:https://example.com');
    });

    test('should export card with N, ORG and TITLE', () => {
      const card = {
        fn: 'Alice',
        n: {
          surname: 'Wonderland',
          given: 'Alice'
        },
        org: {
          fn: 'Organization',
          title: 'Boss'
        }
      };
      const vcard = TheCard.exportVCard(card);
      expect(vcard).toContain('FN:Alice');
      expect(vcard).toContain('N:Wonderland;Alice;;;\r\n');
      expect(vcard).toContain('ORG:Organization\r\n');
      expect(vcard).toContain('TITLE:Boss\r\n');
    });
  });

  describe('importVCard', () => {
    test('should return null for invalid input', () => {
      expect(TheCard.importVCard(null)).toBeNull();
      expect(TheCard.importVCard(123)).toBeNull();
    });

    test('should import minimal card', () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Alice\r\nEND:VCARD';
      const card = TheCard.importVCard(vcard);
      expect(card).toEqual({
        fn: 'Alice'
      });
    });

    test('should import full card', () => {
      const vcard = 'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'FN:Alice\r\n' +
        'NOTE:My Note\r\n' +
        'PHOTO;TYPE=JPEG;ENCODING=b:base64data\r\n' +
        'TEL;TYPE=CELL:123456\r\n' +
        'EMAIL;TYPE=HOME:alice@example.com\r\n' +
        'IMPP;TYPE=HOME:tinode:usr123\r\n' +
        'END:VCARD';
      const card = TheCard.importVCard(vcard);
      expect(card.fn).toBe('Alice');
      expect(card.note).toBe('My Note');
      expect(card.photo).toEqual({
        type: 'jpeg',
        data: 'base64data',
        ref: DEL_CHAR
      });
      expect(card.comm).toContainEqual({
        proto: 'tel',
        des: ['cell'],
        value: '123456'
      });
      expect(card.comm).toContainEqual({
        proto: 'email',
        des: ['home'],
        value: 'alice@example.com'
      });
      expect(card.comm).toContainEqual({
        proto: 'tinode',
        des: ['home'],
        value: 'usr123'
      });
    });

    test('should import card with ref photo', () => {
      const vcard = 'BEGIN:VCARD\r\n' +
        'FN:Bob\r\n' +
        'PHOTO;VALUE=URI:http://example.com/photo.jpg\r\n' +
        'END:VCARD';

      const card = TheCard.importVCard(vcard);
      expect(card.fn).toBe('Bob');
      expect(card.photo).toEqual({
        type: 'jpeg',
        data: DEL_CHAR,
        ref: 'http://example.com/photo.jpg'
      });
    });

    test('should import card with params in FN', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
N:Doe;John;Q.,Public
FN;CHARSET=UTF-8:John Doe
TEL;TYPE=WORK,VOICE:(111) 555-1212
TEL;TYPE=HOME,VOICE:(404) 555-1212
TEL;TYPE=HOME,TYPE=VOICE:(404) 555-1212
EMAIL;TYPE=PREF,INTERNET:forrestgump@example.com
EMAIL;TYPE=INTERNET:example@example.com
ADR;TYPE=HOME:;;42 Plantation St.;Baytown;LA;30314;United States of America
URL:https://www.google.com/
PHOTO;VALUE=URL;TYPE=PNG:http://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Example_svg.svg/200px-Example_svg.svg.png
AGENT:BEGIN:VCARD
 VERSION:3.0
 N:Doe;John;Q.,Public
 FN:John Doe
 TEL;TYPE=WORK,VOICE:(111) 555-1212
 TEL;TYPE=HOME,VOICE:(404) 555-1212
 TEL;TYPE=HOME,TYPE=VOICE:(404) 555-1213
 EMAIL;TYPE=PREF,INTERNET:forrestgump@example.com
 EMAIL;TYPE=INTERNET:example@example.com
 PHOTO;VALUE=URL;TYPE=PNG:http://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Example_svg.svg/200px-Example_svg.svg.png
 END:VCARD
END:VCARD`;

      const card = TheCard.importVCard(vcard);
      expect(card.fn).toBe('John Doe');
      expect(card.photo).toBeDefined();
      expect(card.photo.ref).toBe('http://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Example_svg.svg/200px-Example_svg.svg.png');

      // Verify deduplication: two phone entries with same number should be merged
      const phones = card.comm.filter(c => c.proto === 'tel');
      expect(phones).toHaveLength(2); // Only 2 phones, not 3 (deduplication worked)

      expect(card.comm).toEqual(expect.arrayContaining([
        expect.objectContaining({
          proto: 'tel',
          value: '(111) 555-1212',
          des: expect.arrayContaining(['work', 'voice'])
        }),
        expect.objectContaining({
          proto: 'tel',
          value: '(404) 555-1212',
          des: expect.arrayContaining(['home', 'voice'])
        }),
        expect.objectContaining({
          proto: 'email',
          value: 'forrestgump@example.com',
          des: expect.arrayContaining(['pref']) // 'internet' is filtered out
        }),
        expect.objectContaining({
          proto: 'email',
          value: 'example@example.com',
          des: [] // Only had 'internet' which is filtered out
        }),
        expect.objectContaining({
          proto: 'http',
          value: 'https://www.google.com/',
          des: [] // URL typically has no TYPE
        })
      ]));
      expect(card.n).toEqual({
        surname: 'Doe',
        given: 'John',
        additional: 'Q.,Public'
      });
    });

    test('should import card with N, ORG and TITLE', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
N:Miner;Coal;Diamond;Dr.;Jr.
FN:Dr. Coal D. Miner
ORG:Most Evil Corp;North American Division
TITLE:CEO
END:VCARD`;

      const card = TheCard.importVCard(vcard);
      expect(card.n).toEqual({
        surname: 'Miner',
        given: 'Coal',
        additional: 'Diamond',
        prefix: 'Dr.',
        suffix: 'Jr.'
      });
      expect(card.org).toEqual({
        fn: 'Most Evil Corp',
        title: 'CEO'
      });
    });
  });

  describe('getComm', () => {
    test('should return array of matching comm entries', () => {
      const card = {
        comm: [{
            proto: 'tel',
            des: ['mobile'],
            value: '123'
          },
          {
            proto: 'email',
            des: ['home'],
            value: 'a@test.com'
          },
          {
            proto: 'tel',
            des: ['work'],
            value: '456'
          }
        ]
      };

      const phones = TheCard.getComm(card, 'tel');
      expect(phones).toHaveLength(2);
      expect(phones[0].value).toBe('123');
      expect(phones[1].value).toBe('456');

      const emails = TheCard.getComm(card, 'email');
      expect(emails).toHaveLength(1);
      expect(emails[0].value).toBe('a@test.com');
    });

    test('should return empty array for non-existent proto', () => {
      const card = {
        comm: [{
          proto: 'tel',
          des: ['mobile'],
          value: '123'
        }]
      };
      expect(TheCard.getComm(card, 'email')).toEqual([]);
    });

    test('should return empty array for card without comm', () => {
      const card = {
        fn: 'Test'
      };
      expect(TheCard.getComm(card, 'tel')).toEqual([]);
    });
  });

  describe('importVCard - duplication check', () => {
    test('should not create duplicate entries when importing vCard with single phone', () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Test\r\nTEL;TYPE=CELL:123456\r\nEND:VCARD';
      const card = TheCard.importVCard(vcard);

      console.log('Imported card comm:', JSON.stringify(card.comm, null, 2));

      expect(card.comm).toHaveLength(1);
      expect(TheCard.getComm(card, 'tel')).toHaveLength(1);
    });

    test('should not create duplicate entries when importing vCard with multiple phones', () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Test\r\nTEL;TYPE=CELL:111\r\nTEL;TYPE=HOME:222\r\nEND:VCARD';
      const card = TheCard.importVCard(vcard);

      console.log('Imported card with 2 phones, comm:', JSON.stringify(card.comm, null, 2));

      expect(card.comm).toHaveLength(2);
      expect(TheCard.getComm(card, 'tel')).toHaveLength(2);
    });

    test('should not create duplicates with mixed contact types', () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Test\r\nTEL:111\r\nEMAIL:a@test.com\r\nTEL:222\r\nEND:VCARD';
      const card = TheCard.importVCard(vcard);

      console.log('Imported mixed contacts, comm:', JSON.stringify(card.comm, null, 2));

      expect(card.comm).toHaveLength(3);
      expect(TheCard.getComm(card, 'tel')).toHaveLength(2);
      expect(TheCard.getComm(card, 'email')).toHaveLength(1);
    });

    test('should handle folded lines correctly', () => {
      // vCard spec allows folding lines by starting continuation with space/tab
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Test\r\nTEL;TYPE=CELL:\r\n 123456\r\nEND:VCARD';
      const card = TheCard.importVCard(vcard);

      console.log('Folded line card comm:', JSON.stringify(card.comm, null, 2));

      // Should only have ONE phone entry, not duplicates
      expect(card.comm).toHaveLength(1);
      expect(TheCard.getComm(card, 'tel')).toHaveLength(1);
    });

    test('should deduplicate same phone with multiple TYPE values', () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Test\r\n' +
        'TEL;TYPE=WORK,VOICE:(111) 555-1212\r\n' +
        'TEL;TYPE=HOME,VOICE:(111) 555-1212\r\n' +
        'END:VCARD';
      const card = TheCard.importVCard(vcard);

      // Should have ONE phone entry with all types combined
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        proto: 'tel',
        des: expect.arrayContaining(['work', 'voice', 'home']),
        value: '(111) 555-1212'
      });
      expect(card.comm[0].des).toHaveLength(3);
    });

    test('should handle comma-separated TYPE values', () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Test\r\n' +
        'TEL;TYPE=WORK,VOICE,FAX:123-456-7890\r\n' +
        'END:VCARD';
      const card = TheCard.importVCard(vcard);

      expect(card.comm).toHaveLength(1);
      expect(card.comm[0].des).toEqual(expect.arrayContaining(['work', 'voice', 'fax']));
      expect(card.comm[0].des).toHaveLength(3);
    });
  });

  describe('Export/Import cycle', () => {
    test('should not duplicate contacts after export/import cycle', () => {
      // Create a card with contacts
      let card = {};
      card = TheCard.setFn(card, 'Alice Johnson');
      card = TheCard.addPhone(card, '+15551234567', 'mobile');
      card = TheCard.addPhone(card, '+15559876543', 'work');
      card = TheCard.addEmail(card, 'alice@example.com', 'home');
      card = TheCard.addEmail(card, 'alice.johnson@work.com', 'work');
      card = TheCard.addTinodeID(card, 'usrAlice123', 'home');

      // Verify original counts
      expect(card.comm).toHaveLength(5);
      expect(TheCard.getComm(card, 'tel')).toHaveLength(2);
      expect(TheCard.getComm(card, 'email')).toHaveLength(2);
      expect(TheCard.getComm(card, 'tinode')).toHaveLength(1);

      // Export to vCard
      const vcardStr = TheCard.exportVCard(card);
      expect(vcardStr).toBeTruthy();

      // Import back
      const importedCard = TheCard.importVCard(vcardStr);

      // Verify raw comm array length
      expect(importedCard.comm).toHaveLength(5);

      // Verify no duplicates
      const phones = TheCard.getComm(importedCard, 'tel');
      const emails = TheCard.getComm(importedCard, 'email');
      const tinodeIds = TheCard.getComm(importedCard, 'tinode');

      expect(phones).toHaveLength(2);
      expect(emails).toHaveLength(2);
      expect(tinodeIds).toHaveLength(1);

      // Verify values are correct
      expect(phones.map(p => p.value)).toContain('+15551234567');
      expect(phones.map(p => p.value)).toContain('+15559876543');
      expect(emails.map(e => e.value)).toContain('alice@example.com');
      expect(emails.map(e => e.value)).toContain('alice.johnson@work.com');
      expect(tinodeIds[0].value).toBe('usrAlice123');
    });

    test('should handle multiple export/import cycles without duplication', () => {
      // Create initial card
      let card = TheCard.setFn({}, 'Bob Smith');
      card = TheCard.addPhone(card, '+15551111111', 'mobile');
      card = TheCard.addEmail(card, 'bob@test.com', 'home');

      // First cycle
      let vcardStr = TheCard.exportVCard(card);
      let imported1 = TheCard.importVCard(vcardStr);
      expect(TheCard.getComm(imported1, 'tel')).toHaveLength(1);
      expect(TheCard.getComm(imported1, 'email')).toHaveLength(1);

      // Second cycle
      vcardStr = TheCard.exportVCard(imported1);
      let imported2 = TheCard.importVCard(vcardStr);
      expect(TheCard.getComm(imported2, 'tel')).toHaveLength(1);
      expect(TheCard.getComm(imported2, 'email')).toHaveLength(1);

      // Third cycle
      vcardStr = TheCard.exportVCard(imported2);
      let imported3 = TheCard.importVCard(vcardStr);
      expect(TheCard.getComm(imported3, 'tel')).toHaveLength(1);
      expect(TheCard.getComm(imported3, 'email')).toHaveLength(1);
    });

    test('should correctly export and import IMPP/Tinode entries', () => {
      let card = {};
      card = TheCard.addTinodeID(card, 'usrTest123', 'home');
      card = TheCard.addTinodeID(card, 'usrTest456', 'work');

      const vcardStr = TheCard.exportVCard(card);

      // Check that vCard contains IMPP entries
      expect(vcardStr).toContain('IMPP');
      expect(vcardStr).toContain('usrTest123');
      expect(vcardStr).toContain('usrTest456');

      const imported = TheCard.importVCard(vcardStr);
      const tinodeIds = TheCard.getComm(imported, 'tinode');

      expect(tinodeIds).toHaveLength(2);
      expect(tinodeIds.map(t => t.value)).toContain('usrTest123');
      expect(tinodeIds.map(t => t.value)).toContain('usrTest456');
    });

    test('should correctly export and import URL entries', () => {
      let card = {};
      card = TheCard.setFn(card, 'Test User');
      // Manually add URL to comm array
      card.comm = [{
          proto: 'http',
          des: ['work'],
          value: 'https://example.com'
        },
        {
          proto: 'http',
          des: ['personal'],
          value: 'https://mysite.org'
        }
      ];

      const vcardStr = TheCard.exportVCard(card);

      // Check that vCard contains URL entries
      expect(vcardStr).toContain('URL');
      expect(vcardStr).toContain('https://example.com');
      expect(vcardStr).toContain('https://mysite.org');

      const imported = TheCard.importVCard(vcardStr);
      const urls = TheCard.getComm(imported, 'http');

      expect(urls).toHaveLength(2);
      expect(urls.map(u => u.value)).toContain('https://example.com');
      expect(urls.map(u => u.value)).toContain('https://mysite.org');
    });

    test('should handle contacts without TYPE parameter', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Test User
TEL:(555) 123-4567
EMAIL:test@example.com
IMPP:tinode:usrNoType
END:VCARD`;

      const card = TheCard.importVCard(vcard);

      expect(card.fn).toBe('Test User');
      expect(card.comm).toHaveLength(3);

      const phone = card.comm.find(c => c.proto === 'tel');
      expect(phone).toBeDefined();
      expect(phone.value).toBe('(555) 123-4567');
      expect(phone.des).toEqual([]);

      const email = card.comm.find(c => c.proto === 'email');
      expect(email).toBeDefined();
      expect(email.value).toBe('test@example.com');
      expect(email.des).toEqual([]);

      const tinode = card.comm.find(c => c.proto === 'tinode');
      expect(tinode).toBeDefined();
      expect(tinode.value).toBe('usrNoType');
      expect(tinode.des).toEqual([]);
    });
  });
});
