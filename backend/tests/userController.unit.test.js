const { registerUser, loginUser, getUsers, getProfile } = require('../controllers/userController');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));
const pool = require('../config/db');

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('fake_hash'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('userController (unit)', () => {
  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registerUser - success', async () => {
    const email = 'new@example.com';
    // first call: check existingUser -> no rows
    pool.query.mockResolvedValueOnce({ rows: [] });
    // second call: insert -> returns created user
    pool.query.mockResolvedValueOnce({ rows: [{ id: 42, email, name: null, phone: null, role: 'client', created_at: new Date() }] });

    const req = { body: { email, password: 'pass123' } };
    const res = mockRes();

    await registerUser(req, res);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('success', true);
    expect(sent).toHaveProperty('token');
    expect(sent.user).toBeDefined();
    expect(sent.user.email).toBe(email);
  });

  test('loginUser - invalid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { body: { email: 'nope@example.com', password: 'x' } };
    const res = mockRes();
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('loginUser - success', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'ok@example.com', password_hash: 'hash', role: 'client' }] });
    const req = { body: { email: 'ok@example.com', password: 'pass' } };
    const res = mockRes();
    await loginUser(req, res);
    expect(res.json).toHaveBeenCalled();
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('token');
  });

  test('getUsers - returns list', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a' }, { id: 2, email: 'b' }] });
    const req = {};
    const res = mockRes();
    await getUsers(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, users: expect.any(Array) }));
  });

  test('getProfile - user not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { user: { id: 999 } };
    const res = mockRes();
    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('registerUser - missing fields returns 400', async () => {
    const req = { body: { email: '' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('registerUser - existing email returns 409', async () => {
    const email = 'exists@example.com';
    // existing user found
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    const req = { body: { email, password: 'p' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('registerUser - SQL unique error returns 409', async () => {
    const email = 'dup@example.com';
    // first check: no existing user
    pool.query.mockResolvedValueOnce({ rows: [] });
    // second call (insert) will throw with code 23505
    const err = new Error('duplicate');
    err.code = '23505';
    pool.query.mockRejectedValueOnce(err);
    const req = { body: { email, password: 'p' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('loginUser - missing fields returns 400', async () => {
    const req = { body: { email: '', password: '' } };
    const res = mockRes();
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getProfile - repairer role returns repairer_profile', async () => {
    // first query returns the user with role repairer
    pool.query.mockResolvedValueOnce({ rows: [{ id: 7, email: 'r@r', role: 'repairer' }] });
    // second query returns the repairer profile
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 7, bio: 'ok' }] });
    const req = { user: { id: 7 } };
    const res = mockRes();
    await getProfile(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    const sent = res.json.mock.calls[0][0];
    expect(sent.user.repairer_profile).toBeDefined();
  });

  test('registerUser - unexpected error returns 500', async () => {
    const err = new Error('boom');
    pool.query.mockRejectedValueOnce(err);
    const req = { body: { email: 'u@u', password: 'p' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('loginUser - unexpected error returns 500', async () => {
    const err = new Error('boom');
    pool.query.mockRejectedValueOnce(err);
    const req = { body: { email: 'x@y', password: 'p' } };
    const res = mockRes();
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getUsers - db error returns 500', async () => {
    const err = new Error('fail');
    pool.query.mockRejectedValueOnce(err);
    const req = {};
    const res = mockRes();
    await getUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getProfile - db error returns 500', async () => {
    const err = new Error('fail');
    pool.query.mockRejectedValueOnce(err);
    const req = { user: { id: 1 } };
    const res = mockRes();
    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
