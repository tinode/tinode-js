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

TheCard.contentType = 'text/x-card';

TheCard.setFn = function(card, fn) {
  fn = fn && fn.trim();
  card = card || {};
  card.fn = fn || undefined;
  return card;
}

TheCard.getFn = function(card) {
  if (card && card.fn) {
    return card.fn;
  }
  return null;
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
      // Get mime type from URL, if not provided.
      if (!mimeType) {
        const ext = /\.([a-z0-9]+)$/i.exec(imageUrl);
        if (ext) {
          const extLower = ext[1].toLowerCase();
          const mimeMap = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
          };
          mimeType = mimeMap[extLower] || null;
        }
      }
    }
    card.photo.type = (mimeType || 'image/jpeg').substring('image/'.length);
  } else {
    card = card || {};
    card.photo = DEL_CHAR;
  }
  return card;
}

TheCard.getPhotoUrl = function(card) {
  if (card && card.photo) {
    if (card.photo.ref && card.photo.ref != DEL_CHAR) {
      return card.photo.ref;
    } else if (card.photo.data && card.photo.data != DEL_CHAR) {
      return 'data:image/' + (card.photo.type || 'jpeg') + ';base64,' + card.photo.data;
    }
  }
  return null;
}

TheCard.getOrg = function(card) {
  if (card && card.org) {
    return card.org.fn || null;
  }
  return null;
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

TheCard.getComm = function(card, proto) {
  if (card && Array.isArray(card.comm)) {
    return card.comm.filter(c => c.proto == proto);
  }
  return [];
}

TheCard.getEmails = function(card) {
  return TheCard.getComm(card, 'email').map(c => c.value);
}

TheCard.getPhones = function(card) {
  return TheCard.getComm(card, 'tel').map(c => c.value);
}

TheCard.getFirstTinodeID = function(card) {
  const comms = TheCard.getComm(card, 'tinode');
  if (comms.length > 0) {
    return comms[0].value;
  }
  return null;
}

TheCard.exportVCard = function(card) {
  if (!card) {
    return null;
  }

  let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';

  if (card.fn) {
    vcard += `FN:${card.fn}\r\n`;
  }

  if (card.n) {
    vcard += `N:${card.n.surname || ''};${card.n.given || ''};${card.n.additional || ''};${card.n.prefix || ''};${card.n.suffix || ''}\r\n`;
  }

  if (card.org) {
    if (card.org.fn) {
      vcard += `ORG:${card.org.fn}\r\n`;
    }
    if (card.org.title) {
      vcard += `TITLE:${card.org.title}\r\n`;
    }
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
    if (!keyPart || valueParts.length === 0) {
      return;
    }
    const value = valueParts.join(':');

    const keyParams = keyPart.split(';');
    const key = keyParams[0].trim().toUpperCase();

    if (key === 'FN') {
      card.fn = value;
    } else if (key === 'N') {
      const parts = value.split(';');
      card.n = {
        surname: parts[0] || undefined,
        given: parts[1] || undefined,
        additional: parts[2] || undefined,
        prefix: parts[3] || undefined,
        suffix: parts[4] || undefined,
      };
      // Clean up undefined properties.
      Object.keys(card.n).forEach(key => card.n[key] === undefined && delete card.n[key]);
      if (Object.keys(card.n).length === 0) {
        delete card.n;
      }
    } else if (key === 'ORG') {
      // Multiple values are separated by semicolon. We only use the first one as distinct name.
      // The second one is usually the department, which we skip.
      const parts = value.split(';');
      card.org = card.org || {};
      card.org.fn = parts[0] || undefined;
      if (!card.org.fn) delete card.org.fn;
    } else if (key === 'TITLE') {
      card.org = card.org || {};
      card.org.title = value || undefined;
      if (!card.org.title) delete card.org.title;
    } else if (key === 'NOTE') {
      card.note = value;
    } else if (key === 'PHOTO') {
      const params = keyPart.split(';').slice(1);
      let type = 'jpeg';
      let encoding = null;
      params.forEach(param => {
        const [pKey, pValue] = param.split('=');
        if (pKey && pKey.trim().toUpperCase() === 'TYPE') {
          type = pValue ? pValue.trim().toLowerCase() : 'jpeg';
        } else if (pKey && pKey.trim().toUpperCase() === 'ENCODING') {
          encoding = pValue ? pValue.trim().toLowerCase() : null;
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
    } else if (key === 'TEL') {
      const des = keyPart.split(';').find(param => param.trim().toUpperCase().startsWith('TYPE='))?.split('=')[1].trim().toLowerCase() || 'voice';
      card = TheCard.addPhone(card, value, des);
    } else if (key === 'EMAIL') {
      const des = keyPart.split(';').find(param => param.trim().toUpperCase().startsWith('TYPE='))?.split('=')[1].trim().toLowerCase() || 'home';
      card = TheCard.addEmail(card, value, des);
    } else if (key === 'IMPP') {
      const des = keyPart.split(';').find(param => param.trim().toUpperCase().startsWith('TYPE='))?.split('=')[1].trim().toLowerCase() || 'home';
      const tinodeID = value.replace(/^tinode:/, '');
      card = TheCard.addTinodeID(card, tinodeID, des);
    }
  });

  return card;
}

TheCard.isFileSupported = function(type, name) {
  return type == 'text/vcard' || (name || '').endsWith('.vcf') || (name || '').endsWith('.vcard');
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
