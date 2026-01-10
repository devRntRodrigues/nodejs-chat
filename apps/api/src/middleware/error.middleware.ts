import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose, { MongooseError } from 'mongoose';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger';

type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: unknown;
};

function sanitizeHeaders(headers: Request['headers']) {
  const { _authorization, _cookie, ...rest } = headers;
  return rest;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  logger.error(
    {
      err,
      req: {
        method: req.method,
        url: req.originalUrl,
        headers: sanitizeHeaders(req.headers),
      },
    },
    'request failed'
  );

  let problem: ProblemDetails;

  if (err instanceof AppError) {
    problem = {
      type: `urn:problem-type:${err.type}`,
      title: err.name,
      status: err.statusCode,
      detail: err.message,
      instance: req.originalUrl,
    };

    if (err instanceof ValidationError && err.details) {
      problem.errors = err.details;
    }

    res.status(problem.status).json(problem);
    return;
  }

  if (err instanceof ZodError) {
    problem = {
      type: 'urn:problem-type:validation',
      title: 'Validation Error',
      status: 422,
      detail: 'Invalid request data',
      instance: req.originalUrl,
      errors: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    };

    res.status(problem.status).json(problem);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    problem = {
      type: 'urn:problem-type:validation',
      title: 'Validation Error',
      status: 422,
      detail: 'Invalid data provided',
      instance: req.originalUrl,
      errors: Object.values(err.errors).map((e: any) => ({
        path: e.path,
        message: e.message,
      })),
    };

    res.status(problem.status).json(problem);
    return;
  }

  if (
    err &&
    typeof err === 'object' &&
    (err as MongooseError).name === 'MongoServerError' &&
    (err as MongooseError).message === 'DuplicateKeyError'
  ) {
    problem = {
      type: 'urn:problem-type:conflict',
      title: 'Conflict',
      status: 409,
      detail: 'A resource with that value already exists',
      instance: req.originalUrl,
    };

    res.status(problem.status).json(problem);
    return;
  }

  const message =
    process.env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'An unexpected error occurred';

  problem = {
    type: 'urn:problem-type:internal',
    title: 'Internal Server Error',
    status: 500,
    detail: message,
    instance: req.originalUrl,
  };

  res.status(problem.status).json(problem);
}
