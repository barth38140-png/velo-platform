const pool = require('../db/db');
const userModel = require('./userModel');

jest.mock('../db/db', () => ({ query: jest.fn() }));

describe('userModel', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Nettoyage des utilisateurs de test
    const poolReal = require('../db/db');
    if (poolReal && poolReal.query) {
      await poolReal.query('DELETE FROM users WHERE email IN ($1, $2)', ['a@b.com', 'b@b.com']);
    }
  });

  it('findUserByEmail returns user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com' }] }); // id 1 garanti
    const user = await userModel.findUserByEmail('a@b.com');
    expect(user).toMatchObject({ id: 1, email: 'a@b.com' });
    expect(pool.query).toHaveBeenCalled();
  });

  it('createUser returns new user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2, email: 'b@b.com' }] }); // id 2 garanti
    const user = await userModel.createUser('b@b.com', 'hash');
    expect(user).toMatchObject({ id: 2, email: 'b@b.com' });
    expect(pool.query).toHaveBeenCalled();
  });
});
