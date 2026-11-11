export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal server error';
  if (err.name === 'CastError' || err.name === 'ValidationError') status = 400;
  if (err.code === 11000) { status = 409; message = 'This record already exists.'; }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = 'Images must be 5 MB or smaller.'; }
  if (status >= 500) {
    if (process.env.NODE_ENV !== 'test') console.error(`[${req.method} ${req.path}]`, err.message);
    message = process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : message;
  }
  res.status(status).json({ message, code: status, errors: err.errors ? Object.values(err.errors).map(e => e.message) : undefined });
};
export const notFound = (req, res) => res.status(404).json({ message: 'API endpoint not found', code: 404 });
