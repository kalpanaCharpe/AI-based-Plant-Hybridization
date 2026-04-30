// middleware/requestLogger.js
// Configures morgan HTTP request logging.
// Dev: coloured concise output. Production: combined Apache-style log.

'use strict'

const morgan = require('morgan')

// Custom token: request body (truncated to avoid logging huge payloads)
morgan.token('body', (req) => {
  const b = req.body
  if (!b || Object.keys(b).length === 0) return '-'
  const str = JSON.stringify(b)
  return str.length > 200 ? str.slice(0, 197) + '…' : str
})

const devFormat   = ':method :url :status :response-time ms — :body'
const prodFormat  = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'

const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  {
    skip: (req) => req.url === '/health', // don't log health-check pings
  }
)

module.exports = requestLogger
