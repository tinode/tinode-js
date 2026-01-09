import AccessMode from './access-mode.js';

describe('AccessMode', () => {
  describe('constructor', () => {
    test('creates empty AccessMode when no arguments provided', () => {
      const am = new AccessMode();
      expect(am.given).toBeUndefined();
      expect(am.want).toBeUndefined();
      expect(am.mode).toBeUndefined();
    });

    test('creates AccessMode from string representations', () => {
      const am = new AccessMode({ given: 'RW', want: 'RWP' });
      expect(am.given).toBe(AccessMode._READ | AccessMode._WRITE);
      expect(am.want).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE);
    });

    test('creates AccessMode from numeric values', () => {
      const am = new AccessMode({
        given: AccessMode._READ | AccessMode._WRITE,
        want: AccessMode._READ | AccessMode._WRITE | AccessMode._PRES
      });
      expect(am.given).toBe(AccessMode._READ | AccessMode._WRITE);
      expect(am.want).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE);
    });

    test('uses explicit mode when provided', () => {
      const am = new AccessMode({
        given: 'RWPS',
        want: 'RW',
        mode: 'R'
      });
      expect(am.mode).toBe(AccessMode._READ);
    });

    test('calculates mode as given & want when mode not provided', () => {
      const am = new AccessMode({ given: 'RWPS', want: 'RWP' });
      expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
    });

    test('copies from another AccessMode instance', () => {
      const original = new AccessMode({ given: 'RWP', want: 'RW' });
      const copy = new AccessMode(original);
      expect(copy.given).toBe(original.given);
      expect(copy.want).toBe(original.want);
      expect(copy.mode).toBe(original.mode);
    });
  });

  describe('decode', () => {
    test('returns null for null/undefined input', () => {
      expect(AccessMode.decode(null)).toBeNull();
      expect(AccessMode.decode(undefined)).toBeNull();
    });

    test('returns NONE for "N" or "n"', () => {
      expect(AccessMode.decode('N')).toBe(AccessMode._NONE);
      expect(AccessMode.decode('n')).toBe(AccessMode._NONE);
    });

    test('decodes single permission flags', () => {
      expect(AccessMode.decode('J')).toBe(AccessMode._JOIN);
      expect(AccessMode.decode('R')).toBe(AccessMode._READ);
      expect(AccessMode.decode('W')).toBe(AccessMode._WRITE);
      expect(AccessMode.decode('P')).toBe(AccessMode._PRES);
      expect(AccessMode.decode('A')).toBe(AccessMode._APPROVE);
      expect(AccessMode.decode('S')).toBe(AccessMode._SHARE);
      expect(AccessMode.decode('D')).toBe(AccessMode._DELETE);
      expect(AccessMode.decode('O')).toBe(AccessMode._OWNER);
    });

    test('decodes combined permission flags', () => {
      expect(AccessMode.decode('RW')).toBe(AccessMode._READ | AccessMode._WRITE);
      expect(AccessMode.decode('JRWP')).toBe(AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      expect(AccessMode.decode('JRWPASDO')).toBe(AccessMode._BITMASK);
    });

    test('is case-insensitive', () => {
      expect(AccessMode.decode('rw')).toBe(AccessMode._READ | AccessMode._WRITE);
      expect(AccessMode.decode('RwP')).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
    });

    test('skips unrecognized characters', () => {
      expect(AccessMode.decode('R-W+X')).toBe(AccessMode._READ | AccessMode._WRITE);
      expect(AccessMode.decode('123RW456')).toBe(AccessMode._READ | AccessMode._WRITE);
    });

    test('returns number as-is when masked', () => {
      const num = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.decode(num)).toBe(num);
    });

    test('masks numeric input with BITMASK', () => {
      const largeNum = 0xFFFFFF;
      expect(AccessMode.decode(largeNum)).toBe(AccessMode._BITMASK);
    });

    test('handles duplicate characters', () => {
      expect(AccessMode.decode('RRR')).toBe(AccessMode._READ);
      expect(AccessMode.decode('RWRW')).toBe(AccessMode._READ | AccessMode._WRITE);
    });
  });

  describe('encode', () => {
    test('returns null for null input', () => {
      expect(AccessMode.encode(null)).toBeNull();
    });

    test('returns null for INVALID', () => {
      expect(AccessMode.encode(AccessMode._INVALID)).toBeNull();
    });

    test('returns "N" for NONE', () => {
      expect(AccessMode.encode(AccessMode._NONE)).toBe('N');
    });

    test('encodes single permission flags', () => {
      expect(AccessMode.encode(AccessMode._JOIN)).toBe('J');
      expect(AccessMode.encode(AccessMode._READ)).toBe('R');
      expect(AccessMode.encode(AccessMode._WRITE)).toBe('W');
      expect(AccessMode.encode(AccessMode._PRES)).toBe('P');
      expect(AccessMode.encode(AccessMode._APPROVE)).toBe('A');
      expect(AccessMode.encode(AccessMode._SHARE)).toBe('S');
      expect(AccessMode.encode(AccessMode._DELETE)).toBe('D');
      expect(AccessMode.encode(AccessMode._OWNER)).toBe('O');
    });

    test('encodes combined permission flags in correct order', () => {
      expect(AccessMode.encode(AccessMode._READ | AccessMode._WRITE)).toBe('RW');
      expect(AccessMode.encode(AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES))
        .toBe('JRWP');
      expect(AccessMode.encode(AccessMode._BITMASK)).toBe('JRWPASDO');
    });

    test('encode/decode round trip', () => {
      const original = 'JRWP';
      const decoded = AccessMode.decode(original);
      const encoded = AccessMode.encode(decoded);
      expect(encoded).toBe(original);
    });
  });

  describe('update', () => {
    test('returns original value for null/undefined update', () => {
      const val = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.update(val, null)).toBe(val);
      expect(AccessMode.update(val, undefined)).toBe(val);
    });

    test('returns original value for non-string update', () => {
      const val = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.update(val, 123)).toBe(val);
    });

    test('adds permissions with + prefix', () => {
      const val = AccessMode._READ;
      expect(AccessMode.update(val, '+W')).toBe(AccessMode._READ | AccessMode._WRITE);
      expect(AccessMode.update(val, '+WP')).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
    });

    test('removes permissions with - prefix', () => {
      const val = AccessMode._READ | AccessMode._WRITE | AccessMode._PRES;
      expect(AccessMode.update(val, '-W')).toBe(AccessMode._READ | AccessMode._PRES);
      expect(AccessMode.update(val, '-WP')).toBe(AccessMode._READ);
    });

    test('handles complex delta strings', () => {
      const val = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.update(val, '+P-W')).toBe(AccessMode._READ | AccessMode._PRES);
      expect(AccessMode.update(val, '-W+PS')).toBe(AccessMode._READ | AccessMode._PRES | AccessMode._SHARE);
    });

    test('handles multiple delta operations', () => {
      const val = AccessMode._READ;
      expect(AccessMode.update(val, '+W+P-R')).toBe(AccessMode._WRITE | AccessMode._PRES);
    });

    test('replaces value when no prefix provided', () => {
      const val = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.update(val, 'P')).toBe(AccessMode._PRES);
      expect(AccessMode.update(val, 'JRWPASDO')).toBe(AccessMode._BITMASK);
    });

    test('handles "N" to clear all permissions', () => {
      const val = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.update(val, 'N')).toBe(AccessMode._NONE);
    });

    test('returns original value for invalid update string', () => {
      const val = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.update(val, '+XYZ')).toBe(val);
    });
  });

  describe('diff', () => {
    test('returns bits present in a1 but missing in a2', () => {
      const a1 = AccessMode._READ | AccessMode._WRITE | AccessMode._PRES;
      const a2 = AccessMode._READ | AccessMode._PRES;
      expect(AccessMode.diff(a1, a2)).toBe(AccessMode._WRITE);
    });

    test('returns NONE when a1 is subset of a2', () => {
      const a1 = AccessMode._READ;
      const a2 = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.diff(a1, a2)).toBe(AccessMode._NONE);
    });

    test('accepts string arguments', () => {
      expect(AccessMode.diff('RWP', 'RP')).toBe(AccessMode._WRITE);
      expect(AccessMode.diff('JRWP', 'JRW')).toBe(AccessMode._PRES);
    });

    test('accepts mixed string and numeric arguments', () => {
      expect(AccessMode.diff('RWP', AccessMode._READ | AccessMode._PRES))
        .toBe(AccessMode._WRITE);
    });

    test('returns original when a2 is NONE', () => {
      const a1 = AccessMode._READ | AccessMode._WRITE;
      expect(AccessMode.diff(a1, AccessMode._NONE)).toBe(a1);
    });
  });

  describe('instance methods', () => {
    describe('toString', () => {
      test('returns JSON string representation', () => {
        const am = new AccessMode({ given: 'RW', want: 'RWP' });
        const str = am.toString();
        expect(str).toBe('{"mode": "RW", "given": "RW", "want": "RWP"}');
      });
    });

    describe('jsonHelper', () => {
      test('returns object with encoded values', () => {
        const am = new AccessMode({ given: 'RW', want: 'RWP' });
        const obj = am.jsonHelper();
        expect(obj).toEqual({
          mode: 'RW',
          given: 'RW',
          want: 'RWP'
        });
      });
    });

    describe('setMode', () => {
      test('sets mode from string', () => {
        const am = new AccessMode();
        am.setMode('RW');
        expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE);
      });

      test('sets mode from number', () => {
        const am = new AccessMode();
        am.setMode(AccessMode._READ | AccessMode._WRITE);
        expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode();
        expect(am.setMode('RW')).toBe(am);
      });
    });

    describe('updateMode', () => {
      test('updates mode with delta string', () => {
        const am = new AccessMode({ mode: 'R' });
        am.updateMode('+W');
        expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode({ mode: 'R' });
        expect(am.updateMode('+W')).toBe(am);
      });
    });

    describe('getMode', () => {
      test('returns mode as string', () => {
        const am = new AccessMode({ mode: 'RW' });
        expect(am.getMode()).toBe('RW');
      });
    });

    describe('setGiven', () => {
      test('sets given from string', () => {
        const am = new AccessMode();
        am.setGiven('RWP');
        expect(am.given).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode();
        expect(am.setGiven('RWP')).toBe(am);
      });
    });

    describe('updateGiven', () => {
      test('updates given with delta string', () => {
        const am = new AccessMode({ given: 'RW' });
        am.updateGiven('+P');
        expect(am.given).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode({ given: 'RW' });
        expect(am.updateGiven('+P')).toBe(am);
      });
    });

    describe('getGiven', () => {
      test('returns given as string', () => {
        const am = new AccessMode({ given: 'RWP' });
        expect(am.getGiven()).toBe('RWP');
      });
    });

    describe('setWant', () => {
      test('sets want from string', () => {
        const am = new AccessMode();
        am.setWant('JRWP');
        expect(am.want).toBe(AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode();
        expect(am.setWant('JRWP')).toBe(am);
      });
    });

    describe('updateWant', () => {
      test('updates want with delta string', () => {
        const am = new AccessMode({ want: 'RW' });
        am.updateWant('+PS');
        expect(am.want).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES | AccessMode._SHARE);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode({ want: 'RW' });
        expect(am.updateWant('+PS')).toBe(am);
      });
    });

    describe('getWant', () => {
      test('returns want as string', () => {
        const am = new AccessMode({ want: 'JRWP' });
        expect(am.getWant()).toBe('JRWP');
      });
    });

    describe('getMissing', () => {
      test('returns permissions in want but not in given', () => {
        const am = new AccessMode({ given: 'RW', want: 'RWP' });
        expect(am.getMissing()).toBe('P');
      });

      test('returns N when nothing missing', () => {
        const am = new AccessMode({ given: 'RWP', want: 'RW' });
        expect(am.getMissing()).toBe('N');
      });
    });

    describe('getExcessive', () => {
      test('returns permissions in given but not in want', () => {
        const am = new AccessMode({ given: 'RWP', want: 'RW' });
        expect(am.getExcessive()).toBe('P');
      });

      test('returns N when nothing excessive', () => {
        const am = new AccessMode({ given: 'RW', want: 'RWP' });
        expect(am.getExcessive()).toBe('N');
      });
    });

    describe('updateAll', () => {
      test('updates given, want, and mode from another AccessMode', () => {
        const am = new AccessMode({ given: 'R', want: 'RW' });
        const update = { given: '+WP', want: '+JP' };
        am.updateAll(update);
        expect(am.given).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
        expect(am.want).toBe(AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
        expect(am.mode).toBe(AccessMode._READ | AccessMode._WRITE | AccessMode._PRES);
      });

      test('returns this for chaining', () => {
        const am = new AccessMode({ given: 'R', want: 'RW' });
        expect(am.updateAll({ given: '+WP', want: '+JP' })).toBe(am);
      });

      test('handles null/undefined gracefully', () => {
        const am = new AccessMode({ given: 'RW', want: 'RW' });
        am.updateAll(null);
        expect(am.given).toBe(AccessMode._READ | AccessMode._WRITE);
      });
    });
  });

  describe('permission check methods', () => {
    let am;

    beforeEach(() => {
      am = new AccessMode({
        given: 'JRWPASDO',
        want: 'JRWP',
        mode: 'JRWP'
      });
    });

    describe('isOwner', () => {
      test('checks mode by default', () => {
        const owner = new AccessMode({ mode: 'O' });
        const notOwner = new AccessMode({ mode: 'JRWP' });
        expect(owner.isOwner()).toBe(true);
        expect(notOwner.isOwner()).toBe(false);
      });

      test('checks given when specified', () => {
        expect(am.isOwner('given')).toBe(true);
        expect(am.isOwner('want')).toBe(false);
      });

      test('throws error for invalid side', () => {
        expect(() => am.isOwner('invalid')).toThrow("Invalid AccessMode component 'invalid'");
      });
    });

    describe('isPresencer', () => {
      test('checks if P flag is set', () => {
        expect(am.isPresencer()).toBe(true);
        expect(am.isPresencer('given')).toBe(true);
        expect(am.isPresencer('want')).toBe(true);
      });
    });

    describe('isMuted', () => {
      test('returns opposite of isPresencer', () => {
        expect(am.isMuted()).toBe(false);
        const muted = new AccessMode({ mode: 'RW' });
        expect(muted.isMuted()).toBe(true);
      });
    });

    describe('isJoiner', () => {
      test('checks if J flag is set', () => {
        expect(am.isJoiner()).toBe(true);
        const notJoiner = new AccessMode({ mode: 'RW' });
        expect(notJoiner.isJoiner()).toBe(false);
      });
    });

    describe('isReader', () => {
      test('checks if R flag is set', () => {
        expect(am.isReader()).toBe(true);
        const notReader = new AccessMode({ mode: 'W' });
        expect(notReader.isReader()).toBe(false);
      });
    });

    describe('isWriter', () => {
      test('checks if W flag is set', () => {
        expect(am.isWriter()).toBe(true);
        const notWriter = new AccessMode({ mode: 'R' });
        expect(notWriter.isWriter()).toBe(false);
      });
    });

    describe('isApprover', () => {
      test('checks if A flag is set', () => {
        const approver = new AccessMode({ mode: 'A' });
        expect(approver.isApprover()).toBe(true);
        expect(am.isApprover()).toBe(false);
        expect(am.isApprover('given')).toBe(true);
      });
    });

    describe('isAdmin', () => {
      test('returns true if O or A is set', () => {
        const owner = new AccessMode({ mode: 'O' });
        const approver = new AccessMode({ mode: 'A' });
        const both = new AccessMode({ mode: 'OA' });
        const neither = new AccessMode({ mode: 'RW' });

        expect(owner.isAdmin()).toBe(true);
        expect(approver.isAdmin()).toBe(true);
        expect(both.isAdmin()).toBe(true);
        expect(neither.isAdmin()).toBe(false);
      });
    });

    describe('isSharer', () => {
      test('returns true if O, A, or S is set', () => {
        const owner = new AccessMode({ mode: 'O' });
        const approver = new AccessMode({ mode: 'A' });
        const sharer = new AccessMode({ mode: 'S' });
        const notSharer = new AccessMode({ mode: 'RW' });

        expect(owner.isSharer()).toBe(true);
        expect(approver.isSharer()).toBe(true);
        expect(sharer.isSharer()).toBe(true);
        expect(notSharer.isSharer()).toBe(false);
      });
    });

    describe('isDeleter', () => {
      test('checks if D flag is set', () => {
        const deleter = new AccessMode({ mode: 'D' });
        expect(deleter.isDeleter()).toBe(true);
        expect(am.isDeleter()).toBe(false);
        expect(am.isDeleter('given')).toBe(true);
      });
    });
  });

  describe('method chaining', () => {
    test('allows chaining of setter methods', () => {
      const am = new AccessMode();
      const result = am
        .setGiven('RWP')
        .setWant('JRWP')
        .setMode('RW')
        .updateGiven('+S')
        .updateWant('-J')
        .updateMode('+P');

      expect(result).toBe(am);
      expect(am.getGiven()).toBe('RWPS');
      expect(am.getWant()).toBe('RWP');
      expect(am.getMode()).toBe('RWP');
    });
  });

  describe('constants', () => {
    test('defines permission bit constants', () => {
      expect(AccessMode._NONE).toBe(0x00);
      expect(AccessMode._JOIN).toBe(0x01);
      expect(AccessMode._READ).toBe(0x02);
      expect(AccessMode._WRITE).toBe(0x04);
      expect(AccessMode._PRES).toBe(0x08);
      expect(AccessMode._APPROVE).toBe(0x10);
      expect(AccessMode._SHARE).toBe(0x20);
      expect(AccessMode._DELETE).toBe(0x40);
      expect(AccessMode._OWNER).toBe(0x80);
    });

    test('defines BITMASK as combination of all flags', () => {
      expect(AccessMode._BITMASK).toBe(0xFF);
    });

    test('defines INVALID constant', () => {
      expect(AccessMode._INVALID).toBe(0x100000);
    });
  });
});
