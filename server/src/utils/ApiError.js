/**
 * Custom API Error class.
 * Extends the native Error to carry an HTTP status code, structured
 * error list, and a `success: false` flag for consistent JSON responses.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 409, 500)
   * @param {string} message    - Human-readable error message
   * @param {Array}  errors     - Array of field-level validation errors
   * @param {string} stack      - Optional: pre-captured stack trace
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
