import AccessMode from './access-mode.js';
import {
  mergeObj
} from './utils.js';

describe('AccessMode', () => {
  test('constructs from encoded permissions', () => {
    const access = new AccessMode({
      given: 'JR',
      want: 'JRW'
    });

    expect(access.getGiven()).toBe('JR');
    expect(access.getWant()).toBe('JRW');
    expect(access.getMode()).toBe('JR');
    expect(access.jsonHelper()).toEqual({
      mode: 'JR',
      given: 'JR',
      want: 'JRW'
    });
  });

  test('updates permissions and checks individual flags', () => {
    const access = new AccessMode({
      given: 'JR',
      want: 'JRW'
    });

    access.updateMode('+W');
    access.updateGiven('-J');
    access.updateWant('+P');

    expect(access.getMode()).toBe('JRW');
    expect(access.getGiven()).toBe('R');
    expect(access.getWant()).toBe('JRWP');
    expect(access.isReader()).toBe(true);
    expect(access.isWriter()).toBe(true);
    expect(access.isJoiner('given')).toBe(false);
    expect(access.isPresencer('want')).toBe(true);
    expect(access.getMissing()).toBe('JWP');
    expect(access.getExcessive()).toBe('N');
  });

  test('preserves AccessMode instances when merging nested data', () => {
    const source = new AccessMode({
      given: 'JR',
      want: 'JRW'
    });
    const merged = mergeObj({}, {
      acs: source
    });

    expect(merged.acs).toBeInstanceOf(AccessMode);
    expect(merged.acs).not.toBe(source);
    expect(merged.acs.jsonHelper()).toEqual({
      mode: 'JR',
      given: 'JR',
      want: 'JRW'
    });
    expect(merged.acs.isReader()).toBe(true);
    expect(merged.acs.isWriter()).toBe(false);
  });
});
