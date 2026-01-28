import {
  Tinode
} from './tinode.js';
import * as Const from './config.js';

describe('Tinode - Static Methods', () => {
  describe('credential', () => {
    test('should create credential from individual parameters', () => {
      const cred = Tinode.credential('email', 'user@example.com', {
        key: 'value'
      }, 'response');
      expect(cred).toHaveLength(1);
      expect(cred[0].meth).toBe('email');
      expect(cred[0].val).toBe('user@example.com');
      expect(cred[0].params).toEqual({
        key: 'value'
      });
      expect(cred[0].resp).toBe('response');
    });

    test('should create credential from object parameter', () => {
      const cred = Tinode.credential({
        meth: 'phone',
        val: '+1234567890',
        params: {
          code: '123'
        },
        resp: 'verified'
      });
      expect(cred).toHaveLength(1);
      expect(cred[0].meth).toBe('phone');
      expect(cred[0].val).toBe('+1234567890');
    });

    test('should return null if only method is provided without value or response', () => {
      const cred = Tinode.credential('email');
      expect(cred).toBeNull();
    });

    test('should return null if method is not provided', () => {
      const cred = Tinode.credential(undefined, 'value');
      expect(cred).toBeNull();
    });

    test('should return credential if value is provided', () => {
      const cred = Tinode.credential('email', 'test@example.com');
      expect(cred).toHaveLength(1);
    });

    test('should return credential if response is provided', () => {
      const cred = Tinode.credential('email', null, null, 'response_value');
      expect(cred).toHaveLength(1);
      expect(cred[0].resp).toBe('response_value');
    });
  });

  describe('topicType', () => {
    test('should identify me topic', () => {
      expect(Tinode.topicType('me')).toBe('me');
    });

    test('should identify fnd topic', () => {
      expect(Tinode.topicType('fnd')).toBe('fnd');
    });

    test('should identify sys topic', () => {
      expect(Tinode.topicType('sys')).toBe('sys');
    });

    test('should identify group topic', () => {
      expect(Tinode.topicType('grptest')).toBe('grp');
    });

    test('should identify p2p topic', () => {
      expect(Tinode.topicType('usr123')).toBe('p2p');
    });

    test('should identify slf topic', () => {
      expect(Tinode.topicType('slf')).toBe('slf');
    });

    test('should return undefined for invalid topic', () => {
      expect(Tinode.topicType('invalid-topic')).toBeUndefined();
    });
  });

  describe('isMeTopicName', () => {
    test('should return true for me topic', () => {
      expect(Tinode.isMeTopicName('me')).toBe(true);
    });

    test('should return false for other topics', () => {
      expect(Tinode.isMeTopicName('grptest')).toBe(false);
      expect(Tinode.isMeTopicName('usr123')).toBe(false);
      expect(Tinode.isMeTopicName('fnd')).toBe(false);
    });

    test('should return false for null/undefined', () => {
      expect(Tinode.isMeTopicName(null)).toBe(false);
      expect(Tinode.isMeTopicName(undefined)).toBe(false);
    });
  });

  describe('isSelfTopicName', () => {
    test('should return true for slf topic', () => {
      expect(Tinode.isSelfTopicName('slf')).toBe(true);
    });

    test('should return false for other topics', () => {
      expect(Tinode.isSelfTopicName('grptest')).toBe(false);
      expect(Tinode.isSelfTopicName('usr123')).toBe(false);
    });
  });

  describe('isGroupTopicName', () => {
    test('should return true for group topics', () => {
      expect(Tinode.isGroupTopicName('grptest')).toBe(true);
      expect(Tinode.isGroupTopicName('grpabcdef')).toBe(true);
    });

    test('should return false for non-group topics', () => {
      expect(Tinode.isGroupTopicName('me')).toBe(false);
      expect(Tinode.isGroupTopicName('usr123')).toBe(false);
      expect(Tinode.isGroupTopicName('fnd')).toBe(false);
    });
  });

  describe('isP2PTopicName', () => {
    test('should return true for p2p topics', () => {
      expect(Tinode.isP2PTopicName('usr123')).toBe(true);
      expect(Tinode.isP2PTopicName('usrABC')).toBe(true);
    });

    test('should return false for non-p2p topics', () => {
      expect(Tinode.isP2PTopicName('me')).toBe(false);
      expect(Tinode.isP2PTopicName('grptest')).toBe(false);
      expect(Tinode.isP2PTopicName('fnd')).toBe(false);
    });
  });

  describe('isCommTopicName', () => {
    test('should return true for communication topics (p2p, slf or group)', () => {
      expect(Tinode.isCommTopicName('usr123')).toBe(true);
      expect(Tinode.isCommTopicName('grptest')).toBe(true);
      expect(Tinode.isCommTopicName('slf')).toBe(true);
    });

    test('should return false for non-communication topics', () => {
      expect(Tinode.isCommTopicName('me')).toBe(false);
      expect(Tinode.isCommTopicName('fnd')).toBe(false);
      expect(Tinode.isCommTopicName('sys')).toBe(false);
    });
  });

  describe('isNewGroupTopicName', () => {
    test('should return true for new group topic names', () => {
      expect(Tinode.isNewGroupTopicName('new123')).toBe(true);
      expect(Tinode.isNewGroupTopicName('nch123')).toBe(true);
    });

    test('should return false for non-new topics', () => {
      expect(Tinode.isNewGroupTopicName('grptest')).toBe(false);
      expect(Tinode.isNewGroupTopicName('usr123')).toBe(false);
      expect(Tinode.isNewGroupTopicName('chn123')).toBe(false);
    });
  });

  describe('isChannelTopicName', () => {
    test('should return true for channel topic names', () => {
      expect(Tinode.isChannelTopicName('chn123')).toBe(true);
      expect(Tinode.isChannelTopicName('nch123')).toBe(true);
    });

    test('should return false for non-channel topics', () => {
      expect(Tinode.isChannelTopicName('grptest')).toBe(false);
      expect(Tinode.isChannelTopicName('usr123')).toBe(false);
    });
  });

  describe('getVersion', () => {
    test('should return version string', () => {
      const version = Tinode.getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });

    test('should return a non-empty version', () => {
      const version = Tinode.getVersion();
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('setNetworkProviders', () => {
    test('should accept WebSocket and XMLHttpRequest providers', () => {
      const mockWs = {};
      const mockXhr = {};
      expect(() => {
        Tinode.setNetworkProviders(mockWs, mockXhr);
      }).not.toThrow();
    });

    test('should accept null providers', () => {
      expect(() => {
        Tinode.setNetworkProviders(null, null);
      }).not.toThrow();
    });
  });

  describe('setDatabaseProvider', () => {
    test('should accept indexedDB provider', () => {
      const mockDb = {};
      expect(() => {
        Tinode.setDatabaseProvider(mockDb);
      }).not.toThrow();
    });

    test('should accept null provider', () => {
      expect(() => {
        Tinode.setDatabaseProvider(null);
      }).not.toThrow();
    });
  });

  describe('getLibrary', () => {
    test('should return library name and version', () => {
      const lib = Tinode.getLibrary();
      expect(lib).toBeDefined();
      expect(typeof lib).toBe('string');
      expect(lib.length).toBeGreaterThan(0);
    });
  });

  describe('isNullValue', () => {
    test('should return true for DEL_CHAR', () => {
      expect(Tinode.isNullValue(Const.DEL_CHAR)).toBe(true);
    });

    test('should return false for regular strings', () => {
      expect(Tinode.isNullValue('test')).toBe(false);
      expect(Tinode.isNullValue('value')).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(Tinode.isNullValue('')).toBe(false);
    });

    test('should return false for null', () => {
      expect(Tinode.isNullValue(null)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(Tinode.isNullValue(undefined)).toBe(false);
    });
  });

  describe('isServerAssignedSeq', () => {
    test('should return true for valid server-assigned seq', () => {
      expect(Tinode.isServerAssignedSeq(1)).toBe(true);
      expect(Tinode.isServerAssignedSeq(100)).toBe(true);
      expect(Tinode.isServerAssignedSeq(Const.LOCAL_SEQID - 1)).toBe(true);
    });

    test('should return false for local seq IDs', () => {
      expect(Tinode.isServerAssignedSeq(Const.LOCAL_SEQID)).toBe(false);
      expect(Tinode.isServerAssignedSeq(Const.LOCAL_SEQID + 1)).toBe(false);
    });

    test('should return false for zero and negative values', () => {
      expect(Tinode.isServerAssignedSeq(0)).toBe(false);
      expect(Tinode.isServerAssignedSeq(-1)).toBe(false);
    });
  });

  describe('parseTinodeUrl', () => {
    test('should extract user ID from tinode:///id/ URL', () => {
      const userId = Tinode.parseTinodeUrl('tinode:///id/usr123');
      expect(userId).toBe('usr123');
    });

    test('should extract user ID from longer tinode URL', () => {
      const userId = Tinode.parseTinodeUrl('tinode:///id/usrABCDEF');
      expect(userId).toBe('usrABCDEF');
    });

    test('should return original string if not a tinode URL', () => {
      const url = 'user@example.com';
      expect(Tinode.parseTinodeUrl(url)).toBe(url);
    });

    test('should return original URL if cannot be parsed as tinode URL', () => {
      const url = 'tinode:///invalid';
      expect(Tinode.parseTinodeUrl(url)).toBe(url);
    });

    test('should return null for null input', () => {
      expect(Tinode.parseTinodeUrl(null)).toBeNull();
    });

    test('should return null for undefined input', () => {
      expect(Tinode.parseTinodeUrl(undefined)).toBeNull();
    });

    test('should return null for non-string input', () => {
      expect(Tinode.parseTinodeUrl(123)).toBeNull();
      expect(Tinode.parseTinodeUrl({})).toBeNull();
    });
  });

  describe('isValidTagValue', () => {
    test('should return true for valid tags', () => {
      expect(Tinode.isValidTagValue('test')).toBe(true);
      expect(Tinode.isValidTagValue('tag123')).toBe(true);
      expect(Tinode.isValidTagValue('a_tag')).toBe(true);
      expect(Tinode.isValidTagValue('tag-name')).toBe(true);
    });

    test('should return false for tags shorter than 4 characters', () => {
      expect(Tinode.isValidTagValue('tag')).toBe(false);
      expect(Tinode.isValidTagValue('ab')).toBe(false);
    });

    test('should return false for tags longer than 24 characters', () => {
      expect(Tinode.isValidTagValue('a'.repeat(25))).toBe(false);
    });

    test('should return false for tags starting with special characters', () => {
      expect(Tinode.isValidTagValue('_tag')).toBe(false);
      expect(Tinode.isValidTagValue('-tag')).toBe(false);
    });

    test('should return false for empty or null tags', () => {
      expect(!Tinode.isValidTagValue('')).toBe(true);
      expect(Tinode.isValidTagValue(null)).toBeFalsy();
      expect(Tinode.isValidTagValue(undefined)).toBeFalsy();
    });

    test('should return false for non-string tags', () => {
      expect(Tinode.isValidTagValue(123)).toBe(false);
      expect(Tinode.isValidTagValue({})).toBe(false);
    });
  });

  describe('tagSplit', () => {
    test('should split fully-qualified tag into prefix and value', () => {
      const result = Tinode.tagSplit('email:user@example.com');
      expect(result).toEqual({
        prefix: 'email',
        value: 'user@example.com'
      });
    });

    test('should handle tags with multiple colons', () => {
      const result = Tinode.tagSplit('type:value:extra');
      expect(result).toEqual({
        prefix: 'type',
        value: 'value:extra'
      });
    });

    test('should return null for tag without colon', () => {
      expect(Tinode.tagSplit('notag')).toBeNull();
    });

    test('should return null for tag with only colon', () => {
      expect(Tinode.tagSplit(':')).toBeNull();
    });

    test('should return null for tag starting with colon', () => {
      expect(Tinode.tagSplit(':value')).toBeNull();
    });

    test('should return null for empty or whitespace tag', () => {
      expect(Tinode.tagSplit('')).toBeNull();
      expect(Tinode.tagSplit('   ')).toBeNull();
    });

    test('should return null for null or undefined', () => {
      expect(Tinode.tagSplit(null)).toBeNull();
      expect(Tinode.tagSplit(undefined)).toBeNull();
    });

    test('should trim whitespace from tag', () => {
      const result = Tinode.tagSplit('  email:test@example.com  ');
      expect(result).toEqual({
        prefix: 'email',
        value: 'test@example.com'
      });
    });
  });

  describe('setUniqueTag', () => {
    test('should add tag to empty array', () => {
      const result = Tinode.setUniqueTag([], 'email:test@example.com');
      expect(result).toContain('email:test@example.com');
    });

    test('should replace existing tag with same prefix', () => {
      const tags = ['email:old@example.com', 'phone:123456'];
      const result = Tinode.setUniqueTag(tags, 'email:new@example.com');
      expect(result).toContain('email:new@example.com');
      expect(result).toContain('phone:123456');
      expect(result).not.toContain('email:old@example.com');
      expect(result).toHaveLength(2);
    });

    test('should add tag to non-empty array without duplicates', () => {
      const tags = ['phone:123456'];
      const result = Tinode.setUniqueTag(tags, 'email:test@example.com');
      expect(result).toContain('phone:123456');
      expect(result).toContain('email:test@example.com');
      expect(result).toHaveLength(2);
    });

    test('should return array with new tag if input array is null or empty', () => {
      expect(Tinode.setUniqueTag(null, 'email:test@example.com')).toContain('email:test@example.com');
      expect(Tinode.setUniqueTag([], 'email:test@example.com')).toContain('email:test@example.com');
    });

    test('should return original array if tag is invalid', () => {
      const tags = ['phone:123456'];
      const result = Tinode.setUniqueTag(tags, 'invalid-tag');
      expect(result).toEqual(tags);
    });
  });

  describe('clearTagPrefix', () => {
    test('should remove tags with given prefix', () => {
      const tags = ['email:test@example.com', 'phone:123456', 'email:another@example.com'];
      const result = Tinode.clearTagPrefix(tags, 'email');
      expect(result).not.toContain('email:test@example.com');
      expect(result).not.toContain('email:another@example.com');
      expect(result).toContain('phone:123456');
    });

    test('should return empty array if all tags have the prefix', () => {
      const tags = ['email:test@example.com', 'email:another@example.com'];
      const result = Tinode.clearTagPrefix(tags, 'email');
      expect(result).toHaveLength(0);
    });

    test('should return original array if no tags match prefix', () => {
      const tags = ['phone:123456', 'alias:username'];
      const result = Tinode.clearTagPrefix(tags, 'email');
      expect(result).toEqual(tags);
    });

    test('should return empty array for null or empty input', () => {
      expect(Tinode.clearTagPrefix(null, 'email')).toEqual([]);
      expect(Tinode.clearTagPrefix([], 'email')).toEqual([]);
    });

    test('should filter out null or empty tag values', () => {
      const tags = ['email:test@example.com', null, '', 'phone:123456'];
      const result = Tinode.clearTagPrefix(tags, 'email');
      expect(result).toContain('phone:123456');
      expect(result.length).toBeLessThan(tags.length);
    });
  });

  describe('tagByPrefix', () => {
    test('should return first tag with given prefix', () => {
      const tags = ['email:test@example.com', 'phone:123456', 'email:another@example.com'];
      const result = Tinode.tagByPrefix(tags, 'email');
      expect(result).toBe('email:test@example.com');
    });

    test('should return undefined if no tag with prefix exists', () => {
      const tags = ['phone:123456', 'alias:username'];
      const result = Tinode.tagByPrefix(tags, 'email');
      expect(result).toBeUndefined();
    });

    test('should return undefined for null or empty array', () => {
      expect(Tinode.tagByPrefix(null, 'email')).toBeUndefined();
      expect(Tinode.tagByPrefix([], 'email')).toBeUndefined();
    });

    test('should skip null or empty values in array', () => {
      const tags = [null, '', 'email:test@example.com', 'phone:123456'];
      const result = Tinode.tagByPrefix(tags, 'email');
      expect(result).toBe('email:test@example.com');
    });

    test('should find tag even if earlier entries are null', () => {
      const tags = [null, null, 'email:test@example.com'];
      const result = Tinode.tagByPrefix(tags, 'email');
      expect(result).toBe('email:test@example.com');
    });
  });
});
