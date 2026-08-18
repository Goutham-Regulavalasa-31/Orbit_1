/**
 * Standardized API success response wrapper.
 * Ensures every successful JSON response has a consistent shape:
 * { statusCode, data, message, success }
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 200, 201)
   * @param {*}      data       - The response payload
   * @param {string} message    - Human-readable success message
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
