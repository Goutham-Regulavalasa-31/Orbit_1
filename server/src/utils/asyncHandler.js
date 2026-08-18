/**
 * Higher-order function that wraps an async Express route handler.
 * Eliminates repetitive try/catch boilerplate in every controller by
 * forwarding any thrown error (including ApiError) to Express's
 * centralized error handling middleware via `next(err)`.
 *
 * @param {Function} requestHandler - An async (req, res, next) => {} function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

export { asyncHandler };
