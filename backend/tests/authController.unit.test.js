const { registerUser, loginUser } = require('../controllers/authController');

jest.mock('../models/userModel', () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn()
}));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const { findUserByEmail, createUser } = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('registerUser - success returns 201 with id/email', async () => {
  const req = { body: { email: 'a@b.com', password: 'pwd' } };
  findUserByEmail.mockResolvedValue(null);
  bcrypt.hash.mockResolvedValue('hashed');
  createUser.mockResolvedValue({ id: 42, email: 'a@b.com' });

  const res = makeRes();
  await registerUser(req, res);

  expect(findUserByEmail).toHaveBeenCalledWith('a@b.com');
  expect(bcrypt.hash).toHaveBeenCalled();
  expect(createUser).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 42, email: 'a@b.com' }));
});

test('registerUser - existing email returns 400', async () => {
  const req = { body: { email: 'x@y.com', password: 'pwd' } };
  findUserByEmail.mockResolvedValue({ id: 1 });
  const res = makeRes();
  await registerUser(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

test('loginUser - success returns token', async () => {
  const req = { body: { email: 'u@u.com', password: 'pwd' } };
  findUserByEmail.mockResolvedValue({ id: 7, password_hash: 'h' });
  bcrypt.compare.mockResolvedValue(true);
  jwt.sign.mockReturnValue('tok');

  const res = makeRes();
  await loginUser(req, res);
  expect(findUserByEmail).toHaveBeenCalledWith('u@u.com');
  expect(bcrypt.compare).toHaveBeenCalledWith('pwd', 'h');
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok' }));
});

test('loginUser - wrong password returns 401', async () => {
  const req = { body: { email: 'u@u.com', password: 'pwd' } };
  findUserByEmail.mockResolvedValue({ id: 7, password_hash: 'h' });
  bcrypt.compare.mockResolvedValue(false);
  const res = makeRes();
  await loginUser(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
});

test('loginUser - unknown user returns 401', async () => {
  const req = { body: { email: 'no@one', password: 'pwd' } };
  findUserByEmail.mockResolvedValue(null);
  const res = makeRes();
  await loginUser(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
});
