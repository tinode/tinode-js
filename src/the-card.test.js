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
  });
});
