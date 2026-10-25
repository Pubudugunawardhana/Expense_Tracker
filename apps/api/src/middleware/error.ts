import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@spendly/shared';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(404)
    .json({ message: `Route ${req.method} ${req.path} not found.` } satisfies ApiErrorBody);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    const body: ApiErrorBody = {
      message: error.issues[0]?.message ?? 'Invalid request.',
      issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    };
    res.status(400).json(body);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message } satisfies ApiErrorBody);
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Invalid id.' } satisfies ApiErrorBody);
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ message: error.message } satisfies ApiErrorBody);
    return;
  }

  if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
    res.status(409).json({ message: 'That already exists.' } satisfies ApiErrorBody);
    return;
  }

  logger.error({ err: error }, 'Unhandled error');
  res
    .status(500)
    .json({ message: 'Something went wrong. Please try again.' } satisfies ApiErrorBody);
};
