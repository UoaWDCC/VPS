import HttpError from "../error/HttpError";
import status from "../error/status";

function errorHandler(err, req, res) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ status: err.status, error: err.message, meta: err.meta });
  }
  return res.status(status.INTERNAL_SERVER_ERROR).json({ error: err.message });
}

export default errorHandler;
