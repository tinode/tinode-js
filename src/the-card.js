'use strict';

import {
  DEL_CHAR
} from './config.js';

export default class TheCard {
  constructor(fn, imageUrl, imageMimeType, note) {
    this.card = theCard(fn, imageUrl, imageMimeType, note);
  }

  getCard() {
    return this.card;
  }
}

TheCard.init = theCard

TheCard.setFn = function(card, fn) {
  fn = fn && fn.trim();
  card = card || {};
  card.fn = fn || undefined;
  return card;
}

TheCard.setNote = function(card, note) {
  note = note && note.trim();
  card = card || {};
  card.note = note ? note : DEL_CHAR;
  return card;
}

TheCard.setPhoto = function(card, imageUrl, imageMimeType) {
  if (imageUrl) {
    card = card || {};
    let mimeType = imageMimeType;
    // Is this a data URL "data:[<mediatype>][;base64],<data>"?
    const matches = /^data:(image\/[-a-z0-9+.]+)?(;base64)?,/i.exec(imageUrl);
    if (matches) {
      mimeType = matches[1];
      card.photo = {
        data: imageUrl.substring(imageUrl.indexOf(',') + 1),
        ref: DEL_CHAR
      };
    } else {
      card.photo = {
        data: DEL_CHAR,
        ref: imageUrl
      };
    }
    card.photo.type = (mimeType || 'image/jpeg').substring('image/'.length);
  } else {
    card = card || {};
    card.photo = DEL_CHAR;
  }
  return card;
}

TheCard.setPhone = function(card, phone, type = 'voice') {
  return addOrSetComm(card, 'tel', phone, type, true);
}

TheCard.setEmail = function(card, email, type = 'home') {
  return addOrSetComm(card, 'email', email, type, true);
}

TheCard.setTinodeID = function(card, tinodeID, type = 'home') {
  return addOrSetComm(card, 'tinode', tinodeID, type, true);
}

TheCard.addPhone = function(card, phone, type = 'voice') {
  return addOrSetComm(card, 'tel', phone, type, false);
}

TheCard.addEmail = function(card, email, type = 'home') {
  return addOrSetComm(card, 'email', email, type, false);
}

TheCard.addTinodeID = function(card, tinodeID, type = 'home') {
  return addOrSetComm(card, 'tinode', tinodeID, type, false);
}

TheCard.clearPhone = function(card, phone, type) {
  return clearComm(card, 'tel', phone, type);
}

TheCard.clearEmail = function(card, email, type) {
  return clearComm(card, 'email', email, type);
}

TheCard.clearTinodeID = function(card, tinodeID, type) {
  return clearComm(card, 'tinode', tinodeID, type);
}

TheCard.exportVCard = function(card) {
  if (!card) {
    return null;
  }

  let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';

  if (card.fn) {
    vcard += `FN:${card.fn}\r\n`;
  }

  if (card.note && card.note != DEL_CHAR) {
    vcard += `NOTE:${card.note}\r\n`;
  }

  if (card.photo) {
    if (card.photo.ref && card.photo.ref != DEL_CHAR) {
      vcard += `PHOTO;VALUE=URI:${card.photo.ref}\r\n`;
    } else if (card.photo.data && card.photo.data != DEL_CHAR) {
      vcard += `PHOTO;TYPE=${card.photo.type.toUpperCase()};ENCODING=b:${card.photo.data}\r\n`;
    }
  }

  if (Array.isArray(card.comm)) {
    card.comm.forEach(comm => {
      if (comm.proto === 'tel') {
        vcard += `TEL;TYPE=${comm.des.toUpperCase()}:${comm.value}\r\n`;
      } else if (comm.proto === 'email') {
        vcard += `EMAIL;TYPE=${comm.des.toUpperCase()}:${comm.value}\r\n`;
      } else if (comm.proto === 'tinode') {
        vcard += `IMPP;TYPE=${comm.des.toUpperCase()};tinode:${comm.value}\r\n`;
      } else if (comm.proto === 'http') {
        vcard += `URL;TYPE=${comm.des.toUpperCase()}:${comm.value}\r\n`;
      }
    });
  }

  vcard += 'END:VCARD\r\n';
  return vcard;
}

TheCard.importVCard = function(vcardStr) {
  if (!vcardStr || typeof vcardStr !== 'string') {
    return null;
  }

  const lines = vcardStr.split(/\r\n|\n/);
  let card = {};

  lines.forEach(line => {
    const [keyPart, ...valueParts] = line.split(':');
    const key = keyPart.toUpperCase();
    const value = valueParts.join(':');

    if (key === 'FN') {
      card.fn = value;
    } else if (key === 'NOTE') {
      card.note = value;
    } else if (key.startsWith('PHOTO')) {
      const params = keyPart.split(';').slice(1);
      let type = 'jpeg';
      let encoding = null;
      params.forEach(param => {
        const [pKey, pValue] = param.split('=');
        if (pKey.toUpperCase() === 'TYPE') {
          type = pValue.toLowerCase();
        } else if (pKey.toUpperCase() === 'ENCODING') {
          encoding = pValue.toLowerCase();
        }
      });
      if (encoding === 'b') {
        card.photo = {
          type: type,
          data: value,
          ref: DEL_CHAR
        };
      } else {
        card.photo = {
          type: type,
          data: DEL_CHAR,
          ref: value
        };
      }
    } else if (key.startsWith('TEL')) {
      const des = keyPart.split(';').find(param => param.startsWith('TYPE='))?.split('=')[1].toLowerCase() || 'voice';
      card = TheCard.addPhone(card, value, des);
    } else if (key.startsWith('EMAIL')) {
      const des = keyPart.split(';').find(param => param.startsWith('TYPE='))?.split('=')[1].toLowerCase() || 'home';
      card = TheCard.addEmail(card, value, des);
    } else if (key.startsWith('IMPP')) {
      const des = keyPart.split(';').find(param => param.startsWith('TYPE='))?.split('=')[1].toLowerCase() || 'home';
      const tinodeID = value.replace(/^tinode:/, '');
      card = TheCard.addTinodeID(card, tinodeID, des);
    }
  });

  return card;
}


function theCard(fn, imageUrl, imageMimeType, note) {
  let card = null;
  fn = fn && fn.trim();
  note = note && note.trim();

  if (fn) {
    card = {
      fn: fn
    };
  }

  if (typeof note == 'string') {
    card = card || {};
    card.note = note ? note : DEL_CHAR;
  }

  if (imageUrl) {
    card = card || {};
    let mimeType = imageMimeType;
    // Is this a data URL "data:[<mediatype>][;base64],<data>"?
    const matches = /^data:(image\/[-a-z0-9+.]+)?(;base64)?,/i.exec(imageUrl);
    if (matches) {
      mimeType = matches[1];
      card.photo = {
        data: imageUrl.substring(imageUrl.indexOf(',') + 1),
        ref: DEL_CHAR
      };
    } else {
      card.photo = {
        data: DEL_CHAR,
        ref: imageUrl
      };
    }
    card.photo.type = (mimeType || 'image/jpeg').substring('image/'.length);
  }

  return card;
}

function addOrSetComm(card, proto, value, type, setOnly) {
  proto = proto && proto.trim();
  value = value && value.trim();
  if (proto && value) {
    card = card || {};
    card.comm = card.comm || [];
    if (setOnly) {
      // Remove existing entries with the same proto and type.
      card.comm = card.comm.filter(c => !(c.proto == proto && c.des == type));
    }
    card.comm.push({
      proto: proto,
      des: type,
      value: value
    });
  }
  return card;
}

function clearComm(card, proto, value, type) {
  if (card && Array.isArray(card.comm)) {
    card.comm = card.comm.filter(c => !(c.proto == proto && (!type || c.des == type) && (!value || c.value == value)));
  }
  return card;
}
