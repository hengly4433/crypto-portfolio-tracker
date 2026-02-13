import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http-error';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ErrorMiddleware]', err);

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return; // Ensure void return
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
};
