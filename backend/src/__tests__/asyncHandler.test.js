const asyncHandler = require('../utils/asyncHandler');

describe('asyncHandler', () => {
  it('calls next on successful execution', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const req = {};
    const res = {};
    const next = jest.fn();

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error when fn returns rejected promise', async () => {
    const expected = new Error('Async error');
    const fn = jest.fn().mockRejectedValue(expected);
    const req = {};
    const res = {};
    const next = jest.fn();

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(expected);
  });

  it('calls next when sync fn throws', async () => {
    const expected = new Error('Sync throw');
    const throwingFn = () => { throw expected; };
    const next = jest.fn();

    const wrapped = asyncHandler(throwingFn);
    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].message).toBe('Sync throw');
  });

  it('returns a middleware function', () => {
    const fn = jest.fn();
    const wrapped = asyncHandler(fn);
    expect(typeof wrapped).toBe('function');
  });
});
