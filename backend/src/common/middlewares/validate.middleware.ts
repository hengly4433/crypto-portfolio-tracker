import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/http-error';

export const validate = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
        const issues = error.issues;
        const message = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new BadRequestError(message));
    } else {
        next(error);
    }
  }
};
