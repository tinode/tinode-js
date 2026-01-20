import Topic from './topic.js';

describe('Reactions handling', () => {
  test('routeData normalizes reactions and stores message', () => {
    // Use a lightweight fake Tinode-like object for DB stubs to avoid touching IndexedDB.
    const fakeTinode = {
      _db: {
        addMessage: jest.fn(() => Promise.resolve()),
        updTopic: jest.fn(() => Promise.resolve()),
        updMessageStatus: jest.fn()
      },
      getCurrentUserID: () => 'alice',
      isMe: (id) => id === 'alice',
      getMeTopic: () => ({
        _refreshContact: jest.fn()
      })
    };

    const topic = new Topic('grp-test');
    topic._tinode = fakeTinode;

    const now = new Date();
    const data = {
      seq: 1,
      from: 'alice',
      ts: now,
      content: 'hi',
      react: [{
        val: ':heart:',
        count: 3,
        users: ['alice', 'bob']
      }]
    };

    topic._routeData(data);

    const saved = topic.findMessage(1);
    expect(saved).toBeDefined();
    expect(Array.isArray(saved.react)).toBe(true);
    // Topic now stores reactions as {val, count, users}
    expect(saved.react[0].val).toBe(':heart:');
    expect(saved.react[0].count).toBe(3);
    expect(Array.isArray(saved.react[0].users)).toBe(true);
    expect(topic.msgReactions(1).length).toBe(1);
    // Ensure the normalized message was persisted to DB
    expect(fakeTinode._db.addMessage).toHaveBeenCalled();
    const persisted = fakeTinode._db.addMessage.mock.calls[0][0];
    expect(Array.isArray(persisted.react)).toBe(true);
    expect(persisted.react[0].val).toBe(':heart:');
  });

  test('routeMeta applies reactions to existing message and persists', () => {
    const fakeTinode = {
      _db: {
        updMessage: jest.fn(() => Promise.resolve()),
        updMessageReact: jest.fn(() => Promise.resolve())
      }
    };
    const topic = new Topic('grp-test');
    topic._tinode = fakeTinode;

    // Add an existing message to be updated by meta.
    topic._messages.put({
      seq: 10,
      from: 'alice',
      ts: new Date()
    });

    const meta = {
      react: [{
        seq: 10,
        data: [{
          val: ':thumbsup:',
          count: 1
        }]
      }]
    };

    topic._routeMeta(meta);

    const msg = topic.findMessage(10);
    expect(msg).toBeDefined();
    expect(Array.isArray(msg.react)).toBe(true);
    // Topic now stores reactions as {val, count, users}
    expect(msg.react[0].val).toBe(':thumbsup:');
    expect(msg.react[0].count).toBe(1);
    // Ensure the DB persistence helper for message reactions was called with the raw reaction array.
    expect(fakeTinode._db.updMessageReact).toHaveBeenCalledWith('grp-test', 10, msg.react);
  });
});
