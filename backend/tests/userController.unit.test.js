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
});
