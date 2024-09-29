export function handle(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export class HttpError extends Error {
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
