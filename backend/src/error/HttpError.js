class HttpError extends Error {
  constructor(message, status = 400, meta) {
    super(message);
    this.status = status;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      status: this.status,
      meta: this.meta,
    };
  }
}

export default HttpError;
