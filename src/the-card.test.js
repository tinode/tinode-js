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
  });

  describe('Communication channels', () => {
    test('addPhone', () => {
      let card = {};
      card = TheCard.addPhone(card, '1234567890', 'mobile');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: '1234567890',
        des: 'mobile',
        proto: 'tel'
      });
    });

    test('setPhone (replace)', () => {
      let card = {
        comm: [{
          value: '000',
          des: 'work',
          proto: 'tel'
        }]
      };
      card = TheCard.setPhone(card, '1234567890', 'work');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: '1234567890',
        des: 'work',
        proto: 'tel'
      });
    });

    test('addEmail', () => {
      let card = {};
      card = TheCard.addEmail(card, 'bob@example.com', 'work');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'bob@example.com',
        des: 'work',
        proto: 'email'
      });
    });

    test('addTinodeID', () => {
      let card = {};
      card = TheCard.addTinodeID(card, 'usr123', 'home');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'usr123',
        des: 'home',
        proto: 'tinode'
      });
    });

    test('clearPhone', () => {
      let card = {
        comm: [{
            value: '123',
            des: 'mobile',
            proto: 'tel'
          },
          {
            value: '456',
            des: 'work',
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
          des: 'work',
          proto: 'email'
        }]
      };
      card = TheCard.setEmail(card, 'new@example.com', 'work');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'new@example.com',
        des: 'work',
        proto: 'email'
      });
    });

    test('setTinodeID', () => {
      let card = {
        comm: [{
          value: 'usr111',
          des: 'home',
          proto: 'tinode'
        }]
      };
      card = TheCard.setTinodeID(card, 'usr222', 'home');
      expect(card.comm).toHaveLength(1);
      expect(card.comm[0]).toEqual({
        value: 'usr222',
        des: 'home',
        proto: 'tinode'
      });
    });

    test('clearEmail', () => {
      let card = {
        comm: [{
          value: 'a@example.com',
          des: 'home',
          proto: 'email'
        }, {
          value: 'b@example.com',
          des: 'work',
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
          des: 'home',
          proto: 'tinode'
        }, {
          value: 'usr2',
          des: 'work',
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
      const card = { fn: 'Alice' };
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
        comm: [
          { proto: 'tel', des: 'CELL', value: '123456' },
          { proto: 'email', des: 'HOME', value: 'alice@example.com' },
          { proto: 'tinode', des: 'HOME', value: 'usr123' }
        ]
      };
      const vcard = TheCard.exportVCard(card);
      expect(vcard).toContain('FN:Alice');
      expect(vcard).toContain('NOTE:My Note');
      expect(vcard).toContain('PHOTO;TYPE=JPEG;ENCODING=b:base64data');
      expect(vcard).toContain('TEL;TYPE=CELL:123456');
      expect(vcard).toContain('EMAIL;TYPE=HOME:alice@example.com');
      expect(vcard).toContain('IMPP;TYPE=HOME;tinode:usr123');
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
      expect(card).toEqual({ fn: 'Alice' });
    });

    test('should import full card', () => {
      const vcard = 'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'FN:Alice\r\n' +
        'NOTE:My Note\r\n' +
        'PHOTO;TYPE=JPEG;ENCODING=b:base64data\r\n' +
        'TEL;TYPE=CELL:123456\r\n' +
        'EMAIL;TYPE=HOME:alice@example.com\r\n' +
        'IMPP;TYPE=HOME;tinode:usr123\r\n' +
        'END:VCARD';
      const card = TheCard.importVCard(vcard);
      expect(card.fn).toBe('Alice');
      expect(card.note).toBe('My Note');
      expect(card.photo).toEqual({ type: 'jpeg', data: 'base64data', ref: DEL_CHAR });
      expect(card.comm).toContainEqual({ proto: 'tel', des: 'cell', value: '123456' });
      expect(card.comm).toContainEqual({ proto: 'email', des: 'home', value: 'alice@example.com' });
      expect(card.comm).toContainEqual({ proto: 'tinode', des: 'home', value: 'usr123' });
    });

    test('should import card with ref photo', () => {
      const vcard = 'BEGIN:VCARD\r\n' +
        'FN:Bob\r\n' +
        'PHOTO;VALUE=URI:http://example.com/photo.jpg\r\n' +
        'END:VCARD';

      const card = TheCard.importVCard(vcard);
      expect(card.fn).toBe('Bob');
      expect(card.photo).toEqual({ type: 'jpeg', data: DEL_CHAR, ref: 'http://example.com/photo.jpg' });
    });
  });
});
