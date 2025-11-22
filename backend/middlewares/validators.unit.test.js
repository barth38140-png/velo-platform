const { validationResult } = require('express-validator');
jest.mock('express-validator', () => {
  const chain = () => ({
    isEmail: () => chain(),
    normalizeEmail: () => chain(),
    withMessage: () => chain(),
    isLength: () => chain(),
    trim: () => chain(),
    notEmpty: () => chain(),
    optional: () => chain(),
    isIn: () => chain(),
    isInt: () => chain(),
    isFloat: () => chain(),
    isBoolean: () => chain(),
  });
  return {
    body: chain,
    param: chain,
    query: chain,
    validationResult: jest.fn(),
  };
});

const { validateRegister } = require('./validators');

describe('validators middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('handleValidationErrors returns 400 on error', () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ param: 'email', msg: 'Invalid' }] });
    const handleValidationErrors = validateRegister[validateRegister.length-1];
    handleValidationErrors(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: [{ field: 'email', message: 'Invalid' }] }));
    expect(next).not.toHaveBeenCalled();
  });

  it('handleValidationErrors calls next on valid', () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const handleValidationErrors = validateRegister[validateRegister.length-1];
    handleValidationErrors(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
