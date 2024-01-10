const ApiError = require("./ApiError");
const { logger } = require("../utils/logger");
/**
 * Handles errors thrown by the server
 * @param {Error} err The error thrown
 * @param {Request} req Request from client
 * @param {Response} res Response to client
 * @param {NextFunction} next The next middleware
 */
function errorHandler(err, req, res, next) {
//  logger.error(err);
  if (err instanceof ApiError) {
    return respondError(req, res, err);
  }else{
	return respondError(req, res, ApiError.internal(err));
  }
}

module.exports = { errorHandler };
