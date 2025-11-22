const jwt = require('jsonwebtoken');
const auth = require('./auth');

jest.mock('jsonwebtoken');

describe('auth middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('returns 401 if no token', () => {
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token invalid', () => {
    req.headers.authorization = 'Bearer faketoken';
    jwt.verify.mockImplementation(() => { throw new Error('bad'); });
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next if token valid', () => {
    req.headers.authorization = 'Bearer goodtoken';
    jwt.verify.mockReturnValue({ userId: 1 });
    auth(req, res, next);
    expect(req.user).toEqual({ userId: 1 });
    expect(next).toHaveBeenCalled();
  });
});
