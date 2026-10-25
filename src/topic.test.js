import Topic from './topic.js';

describe('Topic subscription persistence', () => {
  let topic;
  let db;

  beforeEach(() => {
    const users = {};
    db = {
      updSubscription: jest.fn(),
      remSubscription: jest.fn()
    };
    topic = new Topic('grpTest');
    topic._tinode = {
      _db: db,
      isMe: () => false,
      _cacheGetUser: uid => users[uid],
      _cachePutUser: (uid, user) => {
        users[uid] = user;
      }
    };
    topic._cacheGetUser = topic._tinode._cacheGetUser;
    topic._cachePutUser = topic._tinode._cachePutUser;
  });

  test('persists a received subscriber update', () => {
    const sub = {
      user: 'usrAlice',
      updated: new Date('2026-01-01T00:00:00Z'),
      read: 7
    };

    topic._processMetaSubs([sub]);

    expect(db.updSubscription).toHaveBeenCalledWith('grpTest', 'usrAlice', sub);
    expect(db.remSubscription).not.toHaveBeenCalled();
  });

  test('removes a deleted subscriber from persistent cache', () => {
    topic._processMetaSubs([{
      user: 'usrAlice',
      updated: new Date('2026-01-01T00:00:00Z'),
      deleted: true
    }]);

    expect(db.remSubscription).toHaveBeenCalledWith('grpTest', 'usrAlice');
    expect(db.updSubscription).not.toHaveBeenCalled();
  });
});
