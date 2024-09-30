import HttpError from "../error/HttpError.js";
import status from "../error/status.js";

// eslint-disable-next-line
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ status: err.status, error: err.message, meta: err.meta });
  }
  return res.status(status.INTERNAL_SERVER_ERROR).json({ error: err.message });
}

export default errorHandler;
