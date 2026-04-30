// server.js
// ─────────────────────────────────────────────────────────────────────────────
// Intelligent Hybrid Plant Prediction System — Express server entry point
// Architecture: Routes → Controllers → Services → Models
// ─────────────────────────────────────────────────────────────────────────────

'use strict'

// ── 1. Load environment variables first (before any other import uses them) ──
require('dotenv').config()

const express        = require('express')
const cors           = require('cors')
const connectDB      = require('./config/db')
const requestLogger  = require('./middleware/requestLogger')
const notFound       = require('./middleware/notFound')
const errorHandler   = require('./middleware/errorHandler')

// ── Route modules ─────────────────────────────────────────────────────────────
const plantRoutes      = require('./routes/plantRoutes')
const predictionRoutes = require('./routes/predictionRoutes')
const healthRoutes     = require('./routes/healthRoutes')
const imageProxyRoute  = require('./routes/imageProxyRoute')

// ── 2. Create Express app ─────────────────────────────────────────────────────
const app = express()

// ── 3. CORS configuration ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true)
      }
      callback(new Error(`CORS: Origin "${origin}" is not allowed`))
    },
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  })
)

// ── 4. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ── 5. HTTP request logging ───────────────────────────────────────────────────
// app.use(requestLogger)

// ── 6. API Routes ─────────────────────────────────────────────────────────────
const API_PREFIX = '/api'

app.use('/health',              healthRoutes)           // GET  /health
app.use(`${API_PREFIX}/plants`, plantRoutes)            // GET  /api/plants
                                                        // GET  /api/plants/:name
// app.use(`${API_PREFIX}/predict`, predictionRoutes)
app.use(`${API_PREFIX}`,        predictionRoutes) 
app.use(`${API_PREFIX}`,        imageProxyRoute)      
                                                        

// Root endpoint — quick API info
app.get('/', (req, res) => {
  res.json({
    name:        'Hybrid Plant Prediction System API',
    version:     '1.0.0',
    status:      'running',
    docs: {
      plants:     `GET  ${API_PREFIX}/plants`,
      plant:      `GET  ${API_PREFIX}/plants/:name`,
      predict:    `POST ${API_PREFIX}/predict`,
      history:    `GET  ${API_PREFIX}/history`,
      historyById:`GET  ${API_PREFIX}/history/:id`,
      health:     'GET  /health',
    },
  })
})

// ── 7. 404 handler (must come after all routes) ───────────────────────────────
app.use(notFound)

// ── 8. Global error handler (must be LAST, 4-param signature required) ───────
app.use(errorHandler)

// ── 9. Connect DB and start server ───────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10)

const startServer = async () => {
  await connectDB()

  const server = app.listen(PORT, () => {
    console.log('')
    console.log('  ─────────────────────────────────────────────')
    console.log(`Hybrid Plant API running on port ${PORT}`)
    console.log(`Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`Base URL    : http://localhost:${PORT}${API_PREFIX}`)
    console.log(`ML API      : ${process.env.ML_API_URL || 'http://localhost:8000'}`)
    console.log('─────────────────────────────────────────────')
    console.log('')
  })

  // Handle unhandled promise rejections (outside Express middleware chain)
  process.on('unhandledRejection', (err) => {
    console.error('🔥  Unhandled Promise Rejection:', err.message)
    server.close(() => process.exit(1))
  })

  process.on('uncaughtException', (err) => {
    console.error('🔥  Uncaught Exception:', err.message)
    process.exit(1)
  })

  return server
}

startServer()

// Export app for testing
module.exports = app
