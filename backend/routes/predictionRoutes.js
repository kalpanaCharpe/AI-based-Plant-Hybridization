// routes/predictionRoutes.js

'use strict'

const express = require('express')
const router  = express.Router()

const {
  predictHybrid,
  getHistory,
  getHistoryById,
} = require('../controllers/PredictionController')

const {
  validatePredictBody,
  validateObjectIdParam,
  validatePagination,
} = require('../middleware/validateRequest')

// POST /api/predict
router.post('/predict', validatePredictBody, predictHybrid)

// GET /api/history
router.get('/history', validatePagination, getHistory)

// GET /api/history/:id
router.get('/history/:id', validateObjectIdParam('id'), getHistoryById)

module.exports = router