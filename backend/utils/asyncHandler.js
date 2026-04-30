// utils/asyncHandler.js
// Wraps an async Express route handler and forwards any rejected promise
// to next() so the global error handler catches it.
// Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))

'use strict'

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

module.exports = asyncHandler
