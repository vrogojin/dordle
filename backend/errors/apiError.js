/**
 * API Errors
 */
class ApiError {
  /**
   * Makes a new ApiError
   * @param {Number} code
   * @param {string} message
   */
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }

  /**
   * @param {string} msg
   * @returns A bad request error
   */
  static badRequest(msg) {
    return new ApiError(400, msg);
  }

  /**
   * @param {string} msg
   * @returns A server busy error
   */
  static serverBusy(msg) {
    return new ApiError(429, msg);
  }

  /**
   * @param {string} msg
   * @returns An internal error
   */
  static internal(msg) {
    return new ApiError(500, msg);
  }

  static unauthorized(msg) {
    return new ApiError(401, msg);
  }
}

module.exports = ApiError;
