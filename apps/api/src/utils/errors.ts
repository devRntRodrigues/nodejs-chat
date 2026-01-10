export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly details?: unknown;

  constructor(args: { statusCode: number; message: string; type?: string; details?: unknown }) {
    super(args.message);
    this.name = this.constructor.name;
    this.statusCode = args.statusCode;
    this.type = args.type ?? 'about:blank';
    this.details = args.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Error', details?: unknown) {
    super({ statusCode: 422, message, type: 'validation-error', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super({ statusCode: 401, message, type: 'unauthorized' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super({ statusCode: 404, message, type: 'not-found' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super({ statusCode: 409, message, type: 'conflict' });
  }
}
