// middleware/validateRequest.js
// Lightweight validation middleware — no external validator library needed.
// Each validator is a small middleware factory that throws AppError on failure.

'use strict'

const AppError = require('../utils/AppError')
const mongoose = require('mongoose')

// ── Helpers ──────────────────────────────────────────────────────────────────

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// ── Validators ────────────────────────────────────────────────────────────────

/**
 * Validates POST /predict body.
 * Accepts { plant1Id, plant2Id } OR { plantA, plantB } OR { plant1Name, plant2Name }
 */
const validatePredictBody = (req, res, next) => {
  const { plant1Id, plant2Id, plantAId, plantBId, plantA, plantB, plant1Name, plant2Name, plantAName, plantBName } = req.body

  const idA   = plant1Id   || plantAId
  const idB   = plant2Id   || plantBId
  const nameA = plantA     || plant1Name || plantAName
  const nameB = plantB     || plant2Name || plantBName

  // Must provide at least one plant identifier
  if (!idA && !nameA) {
    return next(new AppError(
      'Request body must include plant1Id + plant2Id (ObjectIds) or plantA + plantB (scientific names)',
      400,
      'MISSING_BODY_FIELDS'
    ))
  }

  // If IDs are provided, they must be valid ObjectIds
  if (idA && !isValidObjectId(idA)) {
    return next(new AppError(`plant1Id "${idA}" is not a valid MongoDB ObjectId`, 400, 'INVALID_OBJECT_ID'))
  }
  if (idB && !isValidObjectId(idB)) {
    return next(new AppError(`plant2Id "${idB}" is not a valid MongoDB ObjectId`, 400, 'INVALID_OBJECT_ID'))
  }

  // If names are provided they must be non-empty strings
  if (nameA && typeof nameA !== 'string') {
    return next(new AppError('plantA must be a string', 400, 'INVALID_TYPE'))
  }
  if (nameB && typeof nameB !== 'string') {
    return next(new AppError('plantB must be a string', 400, 'INVALID_TYPE'))
  }

  // Must provide either both IDs or at least one identifier pair
  if (idA && !idB && !nameB) {
    return next(new AppError('Provide plant2Id or plantB for the second parent plant', 400, 'MISSING_PLANT_B'))
  }
  if (nameA && !nameB && !idB) {
    return next(new AppError('Provide plantB or plant2Id for the second parent plant', 400, 'MISSING_PLANT_B'))
  }

  next()
}

/**
 * Validates that a URL :id param is a valid MongoDB ObjectId.
 */
const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName]
  if (!isValidObjectId(value)) {
    return next(new AppError(`Parameter "${paramName}" must be a valid MongoDB ObjectId`, 400, 'INVALID_OBJECT_ID'))
  }
  next()
}

/**
 * Validates that a URL :name param is a non-empty string with allowed characters.
 */
const validateNameParam = (req, res, next) => {
  const name = req.params.name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Plant name parameter must be a non-empty string', 400, 'INVALID_NAME_PARAM'))
  }
  // Allow letters, spaces, hyphens, dots, apostrophes (covers scientific names)
  if (!/^[\w\s\-.''×()]+$/u.test(decodeURIComponent(name))) {
    return next(new AppError('Plant name contains invalid characters', 400, 'INVALID_NAME_CHARS'))
  }
  next()
}

/**
 * Validates optional pagination query params: limit, skip.
 */
const validatePagination = (req, res, next) => {
  const { limit, skip } = req.query

  if (limit !== undefined) {
    const l = Number(limit)
    if (!Number.isInteger(l) || l < 1 || l > 500) {
      return next(new AppError('Query param "limit" must be an integer between 1 and 500', 400, 'INVALID_PAGINATION'))
    }
  }

  if (skip !== undefined) {
    const s = Number(skip)
    if (!Number.isInteger(s) || s < 0) {
      return next(new AppError('Query param "skip" must be a non-negative integer', 400, 'INVALID_PAGINATION'))
    }
  }

  next()
}

module.exports = {
  validatePredictBody,
  validateObjectIdParam,
  validateNameParam,
  validatePagination,
}
