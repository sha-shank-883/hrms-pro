const { errorHandler, notFound } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, ConflictError, UnauthorizedError } = require('../utils/errors');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles operational AppError with correct status', () => {
    const err = new NotFoundError('Employee not found');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Employee not found',
    });
  });

  it('handles ValidationError with 400', () => {
    const err = new ValidationError('Invalid data');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid data',
    });
  });

  it('handles ConflictError with 409', () => {
    const err = new ConflictError('Duplicate email');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('handles UnauthorizedError with 401', () => {
    const err = new UnauthorizedError('Bad credentials');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('handles PostgreSQL duplicate key error (23505)', () => {
    const err = { code: '23505' };
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Duplicate entry. Resource already exists.',
    });
  });

  it('handles PostgreSQL foreign key error (23503)', () => {
    const err = { code: '23503' };
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles JWT errors', () => {
    const err = { name: 'JsonWebTokenError', message: 'jwt malformed' };
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token',
    });
  });

  it('handles TokenExpiredError', () => {
    const err = { name: 'TokenExpiredError', message: 'jwt expired' };
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 for unknown errors', () => {
    const err = new Error('Something unexpected');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Something unexpected' })
    );
  });
});

describe('notFound middleware', () => {
  it('returns 404', () => {
    const mockReq = {};
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    notFound(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route not found',
    });
  });
});
