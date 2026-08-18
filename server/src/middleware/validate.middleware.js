import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware factory: validates `req.body` against a Zod schema.
 *
 * On success:  replaces `req.body` with the parsed (coerced) data and calls next().
 * On failure:  calls next() with an ApiError(400) containing field-level error details.
 *
 * Usage:
 *   import { z } from 'zod';
 *   import { validate } from '../middleware/validate.middleware.js';
 *
 *   router.post('/register', validate(registerSchema), registerController);
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }

  // Overwrite req.body with parsed data to get Zod's type coercions & defaults
  req.body = result.data;
  next();
};
