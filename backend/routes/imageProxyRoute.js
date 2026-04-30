// routes/imageProxyRoute.js

'use strict'

const express = require('express')
const axios   = require('axios')
const router  = express.Router()

/**
 * GET /api/generate-image
 */
router.get('/generate-image', async (req, res) => {
  const { prompt, seed = 42, width = 512, height = 512 } = req.query

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'prompt query parameter is required' })
  }

  // Build the Pollinations AI URL
  // model=flux  → best photorealistic results
  // enhance=true → additional sharpening
  // nologo=true  → no watermark
  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}` +
    `?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`

  try {
    // Fetch the image server-side — no CORS restrictions here
    const response = await axios.get(pollinationsUrl, {
      responseType: 'stream',
      timeout: 60000,          // 60 s — Pollinations can take up to ~30 s to generate
      headers: {
        'User-Agent': 'HybridFlora/1.0',
        'Accept': 'image/*',
      },
    })

    // Forward the content-type header (always image/jpeg or image/png from Pollinations)
    const contentType = response.headers['content-type'] || 'image/jpeg'
    res.setHeader('Content-Type', contentType)

    // Cache the image for 1 hour — same prompt+seed = same image every time
    res.setHeader('Cache-Control', 'public, max-age=3600')

    // Stream the image directly to the browser
    response.data.pipe(res)

  } catch (err) {
    console.error('[ImageProxy] Failed to fetch from Pollinations:', err.message)

    // If we already started streaming, can't send JSON error — just end
    if (res.headersSent) return res.end()

    const status = err.response?.status || 502
    res.status(status).json({
      error: 'Failed to generate hybrid image',
      detail: err.message,
    })
  }
})

module.exports = router