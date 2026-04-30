// routes/healthRoutes.js
'use strict'

const express   = require('express')
const router    = express.Router()
const mongoose  = require('mongoose')
const MLService = require('../services/MLService')

/**
 * GET /health
 * Returns system health including ML API status.
 */
router.get('/', async (req, res) => {
  const dbState  = mongoose.connection.readyState
  const dbStatus = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' }[dbState] || 'unknown'

  const ml = await MLService.healthCheck()

  const allOk = dbState === 1 && ml.status !== 'unreachable'

  res.status(allOk ? 200 : 503).json({
    status:       allOk ? 'ok' : 'degraded',
    timestamp:    new Date().toISOString(),
    uptime_s:     Math.floor(process.uptime()),
    node_env:     process.env.NODE_ENV || 'development',
    prediction_mode: 'ml_only',
    services: {
      database:       dbStatus,
      ml_api:         ml.status,
      ml_trained:     ml.models_trained,
      ml_url:         ml.url,
    },
  })
})

module.exports = router
