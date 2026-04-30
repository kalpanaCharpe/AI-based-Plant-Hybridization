// middleware/errorHandler.js
// Global Express error-handling middleware.
// Must be registered LAST, after all routes.

'use strict'

const AppError = require('../utils/AppError')

// ── Mongoose-specific error translators ─────────────────────────────────────

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: "${err.value}"`, 400, 'INVALID_ID')

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0]
  const value = err.keyValue[field]
  return new AppError(`Duplicate value for field "${field}": "${value}"`, 409, 'DUPLICATE_KEY')
}

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message).join('; ')
  return new AppError(`Validation failed: ${messages}`, 400, 'VALIDATION_ERROR')
}

// ── Development error response (full stack) ──────────────────────────────────
const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    success:    false,
    status:     err.status  || 'error',
    code:       err.code    || null,
    message:    err.message,
    stack:      err.stack,
  })
}

// ── Production error response (sanitised) ────────────────────────────────────
const sendProdError = (err, res) => {
  if (err.isOperational) {
    // Known error — safe to expose the message
    res.status(err.statusCode).json({
      success: false,
      status:  err.status,
      code:    err.code || null,
      message: err.message,
    })
  } else {
    // Unknown/programmer error — don't leak internals
    console.error('🔥 UNHANDLED ERROR:', err)
    res.status(500).json({
      success: false,
      status:  'error',
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}

// ── Main error handler ────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status     = err.status     || 'error'

  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    sendDevError(err, res)
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err)

    if (error.name === 'CastError')           error = handleCastError(error)
    if (error.code === 11000)                  error = handleDuplicateKeyError(error)
    if (error.name === 'ValidationError')      error = handleValidationError(error)
    if (error.name === 'JsonWebTokenError')    error = new AppError('Invalid token.', 401, 'INVALID_TOKEN')
    if (error.name === 'TokenExpiredError')    error = new AppError('Token expired.', 401, 'TOKEN_EXPIRED')

    sendProdError(error, res)
  }
}

module.exports = errorHandler
