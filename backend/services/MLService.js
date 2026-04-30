// services/MLService.js
// ML-ONLY mode — no rule-based fallback.
// If the Flask ML API is unreachable or returns an error, this throws an
// AppError so the controller returns a clean JSON error to the frontend.

'use strict'

const axios    = require('axios')
const AppError = require('../utils/AppError')
const { deriveHybridName } = require('../utils/dataTransform')

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000'
const ML_TIMEOUT = parseInt(process.env.ML_TIMEOUT_MS || '10000', 10)

const mlAxios = axios.create({
  baseURL: ML_API_URL,
  timeout: ML_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

class MLService {
  /**
   * Call the Flask ML API and return the predicted hybrid traits.
   * Throws AppError if the ML API is unreachable or returns an error —
   * the global error handler will send a clean JSON response to the client.
   */
  async predict(plantA, plantB) {
    const payload = {
      plantA: {
        name:         plantA.plant_name,
        plant_name:   plantA.plant_name,
        height_cm:    plantA.height_cm,
        leaf_shape:   plantA.leaf_shape,
        flower_color: plantA.flower_color,
        climate:      plantA.climate,
        resistance:   plantA.resistance,
        growth_days:  plantA.growth_days,
        yield_level:  plantA.yield_level,
        family:       plantA.family || '',
      },
      plantB: {
        name:         plantB.plant_name,
        plant_name:   plantB.plant_name,
        height_cm:    plantB.height_cm,
        leaf_shape:   plantB.leaf_shape,
        flower_color: plantB.flower_color,
        climate:      plantB.climate,
        resistance:   plantB.resistance,
        growth_days:  plantB.growth_days,
        yield_level:  plantB.yield_level,
        family:       plantB.family || '',
      },
    }

    let data
    try {
      // console.log(`🤖  Calling ML API → ${ML_API_URL}/predict`)
      const response = await mlAxios.post('/predict', payload)
      data = response.data
    } catch (err) {
      // ── Translate network/HTTP errors into clean AppErrors ─────────────────
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.error(`❌  ML API unreachable at ${ML_API_URL}`)
        throw new AppError(
          `The ML prediction service is not running. Please start it with: python app.py`,
          503,
          'ML_API_UNREACHABLE'
        )
      }

      if (err.code === 'ECONNABORTED') {
        console.error(`❌  ML API timed out after ${ML_TIMEOUT}ms`)
        throw new AppError(
          'The ML prediction service timed out. It may still be loading models.',
          504,
          'ML_API_TIMEOUT'
        )
      }

      if (err.response?.status === 503) {
        console.error(`❌  ML API models not trained yet (503)`)
        throw new AppError(
          'ML models are not trained yet. Run: python train.py inside hybrid-plant-ml/',
          503,
          'ML_MODELS_NOT_TRAINED'
        )
      }

      if (err.response?.status === 500) {
        console.error(`❌  ML API internal error:`, err.response.data)
        throw new AppError(
          'The ML prediction service encountered an internal error.',
          502,
          'ML_API_ERROR'
        )
      }

      // Unknown error
      console.error(`❌  ML API unexpected error:`, err.message)
      throw new AppError(
        `ML prediction failed: ${err.message}`,
        502,
        'ML_API_ERROR'
      )
    }

    // ── Parse the successful ML response ──────────────────────────────────────
    const rawTraits  = data.traits || data.predicted_traits || {}
    const hybridName = data.predicted_hybrid
                       || deriveHybridName(plantA.plant_name, plantB.plant_name)
    const confidence = data.overall_confidence || null

    // Validate that traits are present
    const traitKeys = ['height','leaf_shape','flower_color','climate','resistance','growth_days','yield_level']
    const missingTraits = traitKeys.filter(k => rawTraits[k] === undefined || rawTraits[k] === null)
    if (missingTraits.length === traitKeys.length) {
      throw new AppError(
        'ML API returned an empty prediction. Check that models are trained correctly.',
        502,
        'ML_EMPTY_PREDICTION'
      )
    }

    const traits = {
      height:       rawTraits.height       ?? null,
      leaf_shape:   rawTraits.leaf_shape   ?? null,
      flower_color: rawTraits.flower_color ?? null,
      climate:      rawTraits.climate      ?? null,
      resistance:   rawTraits.resistance   ?? null,
      growth_days:  rawTraits.growth_days  ?? null,
      yield_level:  rawTraits.yield_level  ?? null,
    }

    // console.log(`✅  ML prediction: ${hybridName} (confidence: ${confidence})`)
    return { traits, hybridName, source: 'ml_api', confidence }
  }

  /**
   * Health-check the ML API.
   * Returns status object — does NOT throw.
   */
  async healthCheck() {
    try {
      const { data } = await mlAxios.get('/health', { timeout: 3000 })
      return {
        status:          data.status          || 'ok',
        models_trained:  data.models_trained  || false,
        models_loaded:   data.models_loaded   || false,
        url:             ML_API_URL,
      }
    } catch {
      return { status: 'unreachable', models_trained: false, url: ML_API_URL }
    }
  }
}

module.exports = new MLService()