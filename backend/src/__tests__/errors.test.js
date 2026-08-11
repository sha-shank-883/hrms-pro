const {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} = require('../utils/errors');

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('creates error with message and statusCode', () => {
      const err = new AppError('Something went wrong', 500);
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
    });

    it('has stack trace', () => {
      const err = new AppError('Test', 400);
      expect(err.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('has status 404', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Resource not found');
    });

    it('accepts custom message', () => {
      const err = new NotFoundError('Employee not found');
      expect(err.message).toBe('Employee not found');
      expect(err.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('has status 401', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('has status 403', () => {
      const err = new ForbiddenError('Access denied');
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Access denied');
    });
  });

  describe('ValidationError', () => {
    it('has status 400', () => {
      const err = new ValidationError('Invalid input');
      expect(err.statusCode).toBe(400);
    });
  });

  describe('ConflictError', () => {
    it('has status 409', () => {
      const err = new ConflictError('Duplicate entry');
      expect(err.statusCode).toBe(409);
    });
  });

  it('instanceof checks work correctly', () => {
    const err = new NotFoundError();
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err instanceof NotFoundError).toBe(true);
    expect(err instanceof ValidationError).toBe(false);
  });
});
