// utils/AppError.js
// Custom operational error class. Non-operational errors (bugs) will still
// use the built-in Error and will be caught by the global error handler.

'use strict'

class AppError extends Error {
  /**
   * @param {string} message   Human-readable error message
   * @param {number} statusCode HTTP status code (default 500)
   * @param {string} [code]    Machine-readable error code (e.g. 'PLANT_NOT_FOUND')
   */
  constructor(message, statusCode = 500, code = null) {
    super(message)
    this.statusCode  = statusCode
    this.status      = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error'
    this.code        = code
    this.isOperational = true   // marks as a known, handled error

    // Capture stack trace cleanly
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
