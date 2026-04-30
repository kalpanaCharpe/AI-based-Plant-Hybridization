// config/db.js
// Handles MongoDB connection via Mongoose with retry logic and graceful shutdown.

const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hybrid_plant_db'

// Mongoose connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Timeout after 10 s if server not found
  socketTimeoutMS: 45000,          // Close sockets after 45 s of inactivity
  maxPoolSize: 10,                 // Maintain up to 10 socket connections
}

/**
 * Connect to MongoDB.
 * Retries up to `retries` times with exponential back-off.
 */
const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(MONGO_URI, mongooseOptions)
      console.log(`✅  MongoDB connected → ${conn.connection.host} (db: ${conn.connection.name})`)
      return conn
    } catch (err) {
      console.error(`❌  MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`)
      if (attempt === retries) {
        console.error('💀  All connection attempts exhausted. Exiting.')
        process.exit(1)
      }
      const backoff = delay * attempt
      console.log(`⏳  Retrying in ${backoff / 1000}s…`)
      await new Promise((res) => setTimeout(res, backoff))
    }
  }
}

// ── Mongoose event listeners ────────────────────────────────────────────────
mongoose.connection.on('disconnected', () =>
  console.warn('⚠️   MongoDB disconnected.')
)
mongoose.connection.on('reconnected', () =>
  console.log('🔁  MongoDB reconnected.')
)
mongoose.connection.on('error', (err) =>
  console.error('🔥  Mongoose error:', err.message)
)

// ── Graceful shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑  ${signal} received — closing MongoDB connection…`)
  await mongoose.connection.close()
  console.log('✅  MongoDB connection closed. Goodbye.')
  process.exit(0)
}

process.on('SIGINT',  () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

module.exports = connectDB
