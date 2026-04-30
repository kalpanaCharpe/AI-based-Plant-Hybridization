// middleware/notFound.js
// Catches any request that didn't match a registered route and forwards
// a 404 AppError to the global error handler.

'use strict'

const AppError = require('../utils/AppError')

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'))
}

module.exports = notFound
