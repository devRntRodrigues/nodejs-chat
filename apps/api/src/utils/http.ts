import type { Response } from 'express';

interface ApiResponse<T> {
  data: T;
  meta?: unknown;
}

export function ok<T>(res: Response, data: T, meta?: unknown): void {
  const response: ApiResponse<T> = { data };
  if (meta !== undefined) {
    response.meta = meta;
  }
  res.status(200).json(response);
}

export function created<T>(res: Response, data: T, meta?: unknown): void {
  const response: ApiResponse<T> = { data };
  if (meta !== undefined) {
    response.meta = meta;
  }
  res.status(201).json(response);
}

export function noContent(res: Response): void {
  res.status(204).send();
}
