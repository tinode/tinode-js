/**
 * @file Definition of a contact card, similar to vCard.
 *
 * @copyright 2025-2026 Tinode LLC.
 *
 * TheCard class represents a contact card with various fields such as full name,
 * photo, organization, communication methods, and birthday.
 */

'use strict';

import {
  DEL_CHAR
} from './config.js';

const THE_CARD_MIME_TYPE = 'text/x-the-card';

/**
 * Contact card, similar to vCard. Holds a user's full name, avatar,
 * organization, communication methods, and birthday.
 * @class TheCard
 * @memberof Tinode
 */
export default class TheCard {
  /**
   * Create a new contact card.
   * @param {string} fn - Full name.
   * @param {string} imageUrl - Avatar URL or data URL.
   * @param {string} imageMimeType - MIME type of the avatar image.
   * @param {string} note - Notes or comments about the contact.
   */
  constructor(fn, imageUrl, imageMimeType, note) {
    Object.assign(this, theCard(fn, imageUrl, imageMimeType, note) || {});
  }

  /**
   * Merge another card into this one.
   * @param {Object} that - Card object to merge.
   */
  merge(that) {
    Object.assign(this, that);
  }

  /**
   * Get the MIME type of the card.
   * @returns {string} The MIME type.
   */
  get contentType() {
    return THE_CARD_MIME_TYPE;
  }

  /**
   * Get the size of the card in bytes when serialized as JSON.
   * @returns {number} Size in bytes.
   */
  get size() {
    return JSON.stringify(this).length;
  }
}

TheCard.contentType = THE_CARD_MIME_TYPE;

/**
 * Set the full name on a card.
 * @param {Object} card - The card object.
 * @param {string} fn - Full name to set.
 * @returns {Object} The updated card.
 */
TheCard.setFn = function(card, fn) {
  fn = fn && fn.trim();
  card = card || {};
  card.fn = fn || undefined;
  return card;
}

/**
 * Get the full name from a card.
 * @param {Object} card - The card object.
 * @returns {string|null} The full name or null if not set.
 */
TheCard.getFn = function(card) {
  if (card && card.fn) {
    return card.fn;
  }
  return null;
}

/**
 * Set notes on a card.
 * @param {Object} card - The card object.
 * @param {string} note - Notes to set.
 * @returns {Object} The updated card.
 */
TheCard.setNote = function(card, note) {
  note = note && note.trim();
  card = card || {};
  card.note = note ? note : DEL_CHAR;
  return card;
}

/**
 * Set photo/avatar on a card.
 * @param {Object} card - The card object.
 * @param {string} imageUrl - Image URL or data URL.
 * @param {string} imageMimeType - MIME type of the image.
 * @returns {Object} The updated card.
 */
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

/**
 * Get photo URL from a card.
 * @param {Object} card - The card object.
 * @returns {string|null} Photo URL or data URL, or null if not set.
 */
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

/**
 * Get organization name from a card.
 * @param {Object} card - The card object.
 * @returns {string|null} Organization name or null if not set.
 */
TheCard.getOrg = function(card) {
  if (card && card.org) {
    return card.org.fn || null;
  }
  return null;
}

/**
 * Set a phone number on a card, replacing any existing phone with the same type.
 * @param {Object} card - The card object.
 * @param {string} phone - Phone number.
 * @param {string} [type='voice'] - Type of phone number (e.g., 'voice', 'mobile', 'work').
 * @returns {Object} The updated card.
 */
TheCard.setPhone = function(card, phone, type = 'voice') {
  return addOrSetComm(card, 'tel', phone, type, true);
}

/**
 * Set an email address on a card, replacing any existing email with the same type.
 * @param {Object} card - The card object.
 * @param {string} email - Email address.
 * @param {string} [type='home'] - Type of email (e.g., 'home', 'work').
 * @returns {Object} The updated card.
 */
TheCard.setEmail = function(card, email, type = 'home') {
  return addOrSetComm(card, 'email', email, type, true);
}

/**
 * Set a Tinode ID on a card, replacing any existing ID with the same type.
 * @param {Object} card - The card object.
 * @param {string} tinodeID - Tinode user ID.
 * @param {string} [type='home'] - Type of ID.
 * @returns {Object} The updated card.
 */
TheCard.setTinodeID = function(card, tinodeID, type = 'home') {
  return addOrSetComm(card, 'tinode', tinodeID, type, true);
}

/**
 * Add a phone number to a card without replacing existing ones.
 * @param {Object} card - The card object.
 * @param {string} phone - Phone number.
 * @param {string} [type='voice'] - Type of phone number.
 * @returns {Object} The updated card.
 */
TheCard.addPhone = function(card, phone, type = 'voice') {
  return addOrSetComm(card, 'tel', phone, type, false);
}

/**
 * Add an email address to a card without replacing existing ones.
 * @param {Object} card - The card object.
 * @param {string} email - Email address.
 * @param {string} [type='home'] - Type of email.
 * @returns {Object} The updated card.
 */
TheCard.addEmail = function(card, email, type = 'home') {
  return addOrSetComm(card, 'email', email, type, false);
}

/**
 * Add a Tinode ID to a card without replacing existing ones.
 * @param {Object} card - The card object.
 * @param {string} tinodeID - Tinode user ID.
 * @param {string} [type='home'] - Type of ID.
 * @returns {Object} The updated card.
 */
TheCard.addTinodeID = function(card, tinodeID, type = 'home') {
  return addOrSetComm(card, 'tinode', tinodeID, type, false);
}

/**
 * Remove phone number(s) from a card.
 * @param {Object} card - The card object.
 * @param {string} phone - Phone number to remove (optional).
 * @param {string} type - Type of phone to remove (optional).
 * @returns {Object} The updated card.
 */
TheCard.clearPhone = function(card, phone, type) {
  return clearComm(card, 'tel', phone, type);
}

/**
 * Remove email address(es) from a card.
 * @param {Object} card - The card object.
 * @param {string} email - Email to remove (optional).
 * @param {string} type - Type of email to remove (optional).
 * @returns {Object} The updated card.
 */
TheCard.clearEmail = function(card, email, type) {
  return clearComm(card, 'email', email, type);
}

/**
 * Remove Tinode ID(s) from a card.
 * @param {Object} card - The card object.
 * @param {string} tinodeID - Tinode ID to remove (optional).
 * @param {string} type - Type of ID to remove (optional).
 * @returns {Object} The updated card.
 */
TheCard.clearTinodeID = function(card, tinodeID, type) {
  return clearComm(card, 'tinode', tinodeID, type);
}

/**
 * Get all communication methods of a specific protocol from a card.
 * @param {Object} card - The card object.
 * @param {string} proto - Protocol ('tel', 'email', 'tinode', 'http').
 * @returns {Array} Array of communication entries matching the protocol.
 */
TheCard.getComm = function(card, proto) {
  if (card && Array.isArray(card.comm)) {
    return card.comm.filter(c => c.proto == proto);
  }
  return [];
}

/**
 * Get all email addresses from a card.
 * @param {Object} card - The card object.
 * @returns {Array<string>} Array of email addresses.
 */
TheCard.getEmails = function(card) {
  return TheCard.getComm(card, 'email').map(c => c.value);
}

/**
 * Get all phone numbers from a card.
 * @param {Object} card - The card object.
 * @returns {Array<string>} Array of phone numbers.
 */
TheCard.getPhones = function(card) {
  return TheCard.getComm(card, 'tel').map(c => c.value);
}

/**
 * Get the first Tinode ID from a card.
 * @param {Object} card - The card object.
 * @returns {string|null} The first Tinode ID or null if none.
 */
TheCard.getFirstTinodeID = function(card) {
  const comms = TheCard.getComm(card, 'tinode');
  if (comms.length > 0) {
    return comms[0].value;
  }
  return null;
}

/**
 * Export a card as vCard 3.0 format string.
 * @param {Object} card - The card object to export.
 * @returns {string|null} vCard formatted string or null if card is empty.
 */
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

  if (card.bday && card.bday.m && card.bday.d) {
    // Format as YYYY-MM-DD or --MM-DD if no year
    const year = card.bday.y ? String(card.bday.y).padStart(4, '0') : '--';
    const month = String(card.bday.m).padStart(2, '0');
    const day = String(card.bday.d).padStart(2, '0');
    vcard += `BDAY:${year}-${month}-${day}\r\n`;
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
      const types = comm.des.join(',').toUpperCase();
      if (comm.proto === 'tel') {
        vcard += `TEL;TYPE=${types}:${comm.value}\r\n`;
      } else if (comm.proto === 'email') {
        vcard += `EMAIL;TYPE=${types}:${comm.value}\r\n`;
      } else if (comm.proto === 'tinode') {
        vcard += `IMPP;TYPE=${types}:${comm.value}\r\n`;
      } else if (comm.proto === 'http') {
        vcard += `URL;TYPE=${types}:${comm.value}\r\n`;
      }
    });
  }

  vcard += 'END:VCARD\r\n';
  return vcard;
}

/**
 * Import a vCard formatted string and convert it to a card object.
 * Supports vCard 2.1 and 3.0 formats with various field encodings.
 * @param {string} vcardStr - vCard formatted string.
 * @returns {Object|null} Parsed card object or null if invalid.
 */
TheCard.importVCard = function(vcardStr) {
  if (!vcardStr || typeof vcardStr !== 'string') {
    return null;
  }

  // Handle line folding: lines starting with space or tab are continuations
  // Also handle Quoted-Printable soft line breaks (line ending with =)
  const rawLines = vcardStr.split(/\r\n|\n/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.startsWith(' ') || line.startsWith('\t')) {
      // This is a vCard continuation of the previous line
      currentLine += line.substring(1);
    } else if (currentLine.endsWith('=')) {
      // This is a Quoted-Printable soft line break
      // Remove the trailing = and append the next line directly
      currentLine = currentLine.substring(0, currentLine.length - 1) + line;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = line;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  let card = {};
  // Temporary map to collect and dedupe comm entries
  const commMap = new Map(); // key: "proto:value", value: Set of types

  // Helper to unescape vCard text values (unescape \, \; \\ \n)
  const unescapeValue = (val) => {
    return val.replace(/\\([,;\\n])/g, (match, char) => {
      if (char === 'n') return '\n';
      return char;
    });
  };

  // Helper to decode Quoted-Printable encoding
  const decodeQuotedPrintable = (val) => {
    // Decode =XX sequences to bytes, then decode as UTF-8
    // First collect all bytes
    const bytes = [];
    let i = 0;
    while (i < val.length) {
      if (val[i] === '=' && i + 2 < val.length) {
        const hex = val.substring(i + 1, i + 3);
        if (/^[0-9A-F]{2}$/i.test(hex)) {
          bytes.push(parseInt(hex, 16));
          i += 3;
        } else {
          // Not a valid hex sequence, keep the character as-is
          bytes.push(val.charCodeAt(i));
          i++;
        }
      } else {
        bytes.push(val.charCodeAt(i));
        i++;
      }
    }

    // Decode UTF-8 bytes to string
    try {
      const uint8Array = new Uint8Array(bytes);
      return new TextDecoder('utf-8').decode(uint8Array);
    } catch (e) {
      // Fallback if TextDecoder is not available
      return val.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });
    }
  };

  lines.forEach(line => {
    const [keyPart, ...valueParts] = line.split(':');
    if (!keyPart || valueParts.length === 0) {
      return;
    }
    const value = valueParts.join(':');

    const keyParams = keyPart.split(';');
    const key = keyParams[0].trim().toUpperCase();

    // Check if QUOTED-PRINTABLE encoding is specified
    const isQuotedPrintable = keyParams.some(param =>
      param.trim().toUpperCase() === 'QUOTED-PRINTABLE' ||
      param.trim().toUpperCase() === 'ENCODING=QUOTED-PRINTABLE'
    );

    if (key === 'FN') {
      let processedValue = value;
      if (isQuotedPrintable) {
        processedValue = decodeQuotedPrintable(processedValue);
      }
      card.fn = unescapeValue(processedValue);
    } else if (key === 'N') {
      let processedValue = value;
      if (isQuotedPrintable) {
        processedValue = decodeQuotedPrintable(processedValue);
      }
      const parts = processedValue.split(';');
      card.n = {
        surname: parts[0] ? unescapeValue(parts[0]) : undefined,
        given: parts[1] ? unescapeValue(parts[1]) : undefined,
        additional: parts[2] ? unescapeValue(parts[2]) : undefined,
        prefix: parts[3] ? unescapeValue(parts[3]) : undefined,
        suffix: parts[4] ? unescapeValue(parts[4]) : undefined,
      };
      // Clean up undefined properties.
      Object.keys(card.n).forEach(key => card.n[key] === undefined && delete card.n[key]);
      if (Object.keys(card.n).length === 0) {
        delete card.n;
      }
    } else if (key === 'ORG') {
      // Multiple values are separated by semicolon. We only use the first one as distinct name.
      // The second one is usually the department, which we skip.
      let processedValue = value;
      if (isQuotedPrintable) {
        processedValue = decodeQuotedPrintable(processedValue);
      }
      const parts = processedValue.split(';');
      card.org = card.org || {};
      card.org.fn = parts[0] ? unescapeValue(parts[0]) : undefined;
      if (!card.org.fn) delete card.org.fn;
    } else if (key === 'TITLE') {
      let processedValue = value;
      if (isQuotedPrintable) {
        processedValue = decodeQuotedPrintable(processedValue);
      }
      card.org = card.org || {};
      card.org.title = processedValue ? unescapeValue(processedValue) : undefined;
      if (!card.org.title) delete card.org.title;
    } else if (key === 'NOTE') {
      let processedValue = value;
      if (isQuotedPrintable) {
        processedValue = decodeQuotedPrintable(processedValue);
      }
      card.note = unescapeValue(processedValue);
    } else if (key === 'BDAY') {
      // Parse birthday in various formats
      // Strip time if present (anything after T or space)
      let dateStr = value.split(/[T ]/)[0].trim();

      let year = null;
      let month = null;
      let day = null;

      // Remove hyphens for easier parsing
      const noHyphens = dateStr.replace(/-/g, '');

      if (noHyphens.length === 6 && /^\d{6}$/.test(noHyphens)) {
        // YYMMDD format
        const yy = parseInt(noHyphens.substring(0, 2), 10);
        month = parseInt(noHyphens.substring(2, 4), 10);
        day = parseInt(noHyphens.substring(4, 6), 10);
        // If YY >= 35, it's 19XX, otherwise 20XX
        year = yy >= 35 ? 1900 + yy : 2000 + yy;
      } else if (dateStr.startsWith('--') || dateStr.startsWith('----')) {
        // --MMDD or ----MMDD format (no year)
        const cleaned = dateStr.replace(/^-+/, '');
        if (cleaned.length === 4 && /^\d{4}$/.test(cleaned)) {
          month = parseInt(cleaned.substring(0, 2), 10);
          day = parseInt(cleaned.substring(2, 4), 10);
        } else if (cleaned.includes('-')) {
          const parts = cleaned.split('-');
          if (parts.length >= 2) {
            month = parseInt(parts[0], 10);
            day = parseInt(parts[1], 10);
          }
        }
      } else if (noHyphens.length === 8 && /^\d{8}$/.test(noHyphens)) {
        // YYYYMMDD format
        year = parseInt(noHyphens.substring(0, 4), 10);
        month = parseInt(noHyphens.substring(4, 6), 10);
        day = parseInt(noHyphens.substring(6, 8), 10);
      } else if (dateStr.includes('-')) {
        // YYYY-MM-DD format
        const parts = dateStr.split('-');
        if (parts[0] && parts[0] !== '' && !/^-+$/.test(parts[0])) {
          year = parseInt(parts[0], 10);
        }
        if (parts.length >= 2) {
          month = parseInt(parts[1], 10);
        }
        if (parts.length >= 3) {
          day = parseInt(parts[2], 10);
        }
      }

      // Basic validation
      const isValidMonth = month && month >= 1 && month <= 12;
      const isValidDay = day && day >= 1 && day <= 31;
      const isValidYear = !year || (year >= 1800 && year <= 2200);

      if (isValidMonth && isValidDay && isValidYear) {
        card.bday = {
          m: month,
          d: day
        };
        if (year) {
          card.bday.y = year;
        }
      }
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
      // Extract all TYPE values (can be comma-separated or multiple TYPE= params)
      const typeParams = keyPart.split(';').filter(param => param.trim().toUpperCase().startsWith('TYPE='));
      const types = typeParams.flatMap(param => {
        // Split by first '=' only to get the value part
        const equalIndex = param.indexOf('=');
        const valuesPart = param.substring(equalIndex + 1);
        // Split by comma and clean up any 'TYPE=' prefix
        return valuesPart.split(',').map(t => {
          const cleaned = t.trim().toLowerCase();
          return cleaned.startsWith('type=') ? cleaned.substring(5) : cleaned;
        });
      }).filter(t => t !== 'internet'); // Skip 'internet' type

      const mapKey = `tel|${value}`;
      if (!commMap.has(mapKey)) {
        commMap.set(mapKey, new Set());
      }
      types.forEach(t => commMap.get(mapKey).add(t));
    } else if (key === 'EMAIL') {
      // Extract all TYPE values (can be comma-separated or multiple TYPE= params)
      const typeParams = keyPart.split(';').filter(param => param.trim().toUpperCase().startsWith('TYPE='));
      const types = typeParams.flatMap(param => {
        // Split by first '=' only to get the value part
        const equalIndex = param.indexOf('=');
        const valuesPart = param.substring(equalIndex + 1);
        // Split by comma and clean up any 'TYPE=' prefix
        return valuesPart.split(',').map(t => {
          const cleaned = t.trim().toLowerCase();
          return cleaned.startsWith('type=') ? cleaned.substring(5) : cleaned;
        });
      }).filter(t => t !== 'internet'); // Skip 'internet' type

      const mapKey = `email|${value}`;
      if (!commMap.has(mapKey)) {
        commMap.set(mapKey, new Set());
      }
      types.forEach(t => commMap.get(mapKey).add(t));
    } else if (key === 'IMPP') {
      // Extract all TYPE values (can be comma-separated or multiple TYPE= params)
      const typeParams = keyPart.split(';').filter(param => param.trim().toUpperCase().startsWith('TYPE='));
      const types = typeParams.flatMap(param => {
        // Split by first '=' only to get the value part
        const equalIndex = param.indexOf('=');
        const valuesPart = param.substring(equalIndex + 1);
        // Split by comma and clean up any 'TYPE=' prefix
        return valuesPart.split(',').map(t => {
          const cleaned = t.trim().toLowerCase();
          return cleaned.startsWith('type=') ? cleaned.substring(5) : cleaned;
        });
      }).filter(t => t !== 'internet'); // Skip 'internet' type

      const mapKey = value.startsWith('tinode:') ? `tinode|${value}` : `impp|${value}`;
      if (!commMap.has(mapKey)) {
        commMap.set(mapKey, new Set());
      }
      types.forEach(t => commMap.get(mapKey).add(t));
    } else if (key === 'URL') {
      // Extract all TYPE values (can be comma-separated or multiple TYPE= params)
      const typeParams = keyPart.split(';').filter(param => param.trim().toUpperCase().startsWith('TYPE='));
      const types = typeParams.flatMap(param => {
        // Split by first '=' only to get the value part
        const equalIndex = param.indexOf('=');
        const valuesPart = param.substring(equalIndex + 1);
        // Split by comma and clean up any 'TYPE=' prefix
        return valuesPart.split(',').map(t => {
          const cleaned = t.trim().toLowerCase();
          return cleaned.startsWith('type=') ? cleaned.substring(5) : cleaned;
        });
      }).filter(t => t !== 'internet'); // Skip 'internet' type

      const mapKey = `http|${value}`;
      if (!commMap.has(mapKey)) {
        commMap.set(mapKey, new Set());
      }
      types.forEach(t => commMap.get(mapKey).add(t));
    }
  });

  // Convert commMap to comm array
  if (commMap.size > 0) {
    card.comm = [];
    commMap.forEach((types, key) => {
      const [proto, value] = key.split('|', 2);
      card.comm.push({
        proto: proto,
        des: Array.from(types),
        value: value
      });
    });
  }

  return card;
}

/**
 * Check if a file type or name is a supported vCard format.
 * @param {string} type - MIME type of the file.
 * @param {string} name - File name.
 * @returns {boolean} True if the file is a vCard format.
 */
TheCard.isFileSupported = function(type, name) {
  return type == 'text/vcard' ||
    (name || '').endsWith('.vcf') ||
    (name || '').endsWith('.vcard');
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
      card.comm = card.comm.filter(c => {
        if (c.proto != proto) return true;
        return !c.des.includes(type);
      });
    }
    card.comm.push({
      proto: proto,
      des: [type], // Always use array
      value: value
    });
  }
  return card;
}

function clearComm(card, proto, value, type) {
  if (card && Array.isArray(card.comm)) {
    card.comm = card.comm.filter(c => {
      if (c.proto != proto) return true;
      if (value && c.value != value) return true;
      if (type) {
        return !c.des.includes(type);
      }
      return false;
    });
  }
  return card;
}
