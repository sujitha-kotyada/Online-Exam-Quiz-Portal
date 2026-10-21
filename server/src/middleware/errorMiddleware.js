const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log in development
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error Details]:', err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with invalid identifier: ${err.value}`;
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with this ${field} already exists`;
    return res.status(409).json({
      success: false,
      message
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Default response
  const statusCode = err.statusCode || error.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFoundHandler };
