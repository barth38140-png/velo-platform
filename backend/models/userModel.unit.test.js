const pool = require('../db/db');
const userModel = require('./userModel');

jest.mock('../db/db', () => ({ query: jest.fn() }));

describe('userModel', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('findUserByEmail returns user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com' }] });
    const user = await userModel.findUserByEmail('a@b.com');
    expect(user).toEqual({ id: 1, email: 'a@b.com' });
    expect(pool.query).toHaveBeenCalled();
  });

  it('createUser returns new user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2, email: 'b@b.com' }] });
    const user = await userModel.createUser('b@b.com', 'hash');
    expect(user).toEqual({ id: 2, email: 'b@b.com' });
    expect(pool.query).toHaveBeenCalled();
  });
});
