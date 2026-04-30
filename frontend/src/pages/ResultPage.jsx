// ResultPage.jsx
// Hybrid image is fetched via our own backend proxy (/api/generate-image)
// instead of calling image.pollinations.ai directly from the browser.
// This bypasses the CORS / network block that caused "Could not load AI image".

import { useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'

// ─── Config ───────────────────────────────────────────────────────────────────
// Change this if your backend runs on a different port
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const TRAIT_CONFIG = {
  height:       { label: 'Height',            unit: 'cm'   },
  leaf_shape:   { label: 'Leaf Shape'                      },
  flower_color: { label: 'Flower Color'                    },
  climate:      { label: 'Climate'                         },
  resistance:   { label: 'Disease Resistance'              },
  growth_days:  { label: 'Growth Duration',   unit: 'days' },
  yield_level:  { label: 'Yield Level'                     },
}

const ORDERED_TRAITS = [
  'height', 'leaf_shape', 'flower_color',
  'climate', 'resistance', 'growth_days', 'yield_level',
]

// ─── Build proxy URL ──────────────────────────────────────────────────────────
// Instead of: https://image.pollinations.ai/prompt/...   (blocked by browser)
// We call:    http://localhost:5000/api/generate-image?prompt=...
// Our Express server fetches from Pollinations server-side and streams back.
function buildProxyUrl({ plant1Name, plant2Name, hybridName, traits }) {
  const { height, leaf_shape, flower_color, climate, yield_level } = traits || {}

  const heightCat =
    parseFloat(height) < 80  ? 'small compact' :
    parseFloat(height) < 150 ? 'medium-sized'  :
    parseFloat(height) < 250 ? 'tall'           : 'very tall'

  const prompt = [
    `photorealistic botanical photograph of a single hybrid plant specimen`,
    `, a cross between ${plant1Name} and ${plant2Name}`,
    `. ${heightCat} plant`,
    flower_color ? `, with ${flower_color.toLowerCase()} flowers` : '',
    leaf_shape   ? `, ${leaf_shape.toLowerCase()} leaves`         : '',
    climate      ? `, suited to ${climate.toLowerCase()} climate` : '',
    yield_level  ? `, ${yield_level.toLowerCase()} yield`         : '',
    `. Natural lighting, sharp focus, white background,`,
    ` professional botanical photography, highly detailed, single plant, no text`,
  ].join('')

  // Deterministic seed — same plant pair always generates the same image
  const seed = (plant1Name + plant2Name)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 99999

  return `${API_BASE}/generate-image?prompt=${encodeURIComponent(prompt)}&seed=${seed}`
}

// ─── HybridImage ──────────────────────────────────────────────────────────────
// Uses direct <img src> pointing to our backend proxy URL.
// onLoad / onError on the rendered <img> manage the spinner state.
function HybridImage({ url, hybridName }) {
  const [status, setStatus] = useState('loading') // loading | done | error

  if (!url) return (
    <div className="w-full h-full flex items-center justify-center text-5xl bg-green-50">
      🧬
    </div>
  )

  return (
    <div className="relative w-full h-full bg-green-50">

      {/* Spinner while image is being generated (15–30 s) */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
          <div className="w-8 h-8 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-green-600 font-semibold text-center px-2">
            Generating AI image…
          </p>
          <p className="text-[10px] text-green-400 text-center leading-snug px-2">
            Pollinations AI<br />may take 15–30s
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 px-3">
          <span className="text-4xl">🧬</span>
          <p className="text-[10px] text-red-400 text-center font-medium">
            Image generation failed
          </p>
          <p className="text-[9px] text-gray-400 text-center">
            Ensure backend is running on port 5000
          </p>
        </div>
      )}

      {/* Actual image — in DOM immediately, hidden until onLoad fires */}
      <img
        src={url}
        alt={`AI-generated hybrid: ${hybridName}`}
        className="w-full h-full object-cover"
        style={{ display: status === 'done' ? 'block' : 'none' }}
        onLoad={()  => setStatus('done')}
        onError={() => setStatus('error')}
      />
    </div>
  )
}

// ─── Plant Lineage Panel ──────────────────────────────────────────────────────
function PlantLineageImages({ prediction, plant1Name, plant2Name, hybridName }) {
  const plantAImage = prediction?.plantA_image || ''
  const plantBImage = prediction?.plantB_image || ''
  const traits      = prediction?.traits || {}

  // Build proxy URL once — stable across re-renders
  const hybridUrl = useMemo(
    () => buildProxyUrl({ plant1Name, plant2Name, hybridName, traits }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plant1Name, plant2Name, hybridName]
  )

  return (
    <div className="mb-6">
      {/* <p className="text-xs font-semibold uppercase tracking-widest text-center text-gray-400 mb-4">
        🌿 Plant Lineage Visualisation
      </p> */}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">

        {/* Parent A */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50">
            {plantAImage
              ? <img src={plantAImage} alt={plant1Name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-4xl">🌱</div>
            }
          </div>
          <p className="text-xs text-center font-medium text-gray-600 leading-tight line-clamp-2 px-1">
            {plant1Name || 'Parent A'}
          </p>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Parent A
          </span>
        </div>

        {/* AI Hybrid — centre */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-green-400
                          shadow-lg ring-2 ring-green-200 ring-offset-1">
            <HybridImage url={hybridUrl} hybridName={hybridName} />
          </div>
          <p className="text-xs text-center font-bold text-green-800 leading-tight line-clamp-2 px-1">
            {hybridName}
          </p>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
             AI Hybrid
          </span>
        </div>

        {/* Parent B */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50">
            {plantBImage
              ? <img src={plantBImage} alt={plant2Name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-4xl">🌱</div>
            }
          </div>
          <p className="text-xs text-center font-medium text-gray-600 leading-tight line-clamp-2 px-1">
            {plant2Name || 'Parent B'}
          </p>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Parent B
          </span>
        </div>

      </div>
    </div>
  )
}

// ─── Trait Card ───────────────────────────────────────────────────────────────
function TraitCard({ traitKey, value, description }) {
  const config  = TRAIT_CONFIG[traitKey] || { label: traitKey }
  const display = config.unit ? `${value} ${config.unit}` : String(value ?? '—')
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden
                    hover:border-green-300 hover:shadow-sm transition-all duration-200">
      <div className="px-4 pt-4 pb-2">
        <p className="text-base font-bold text-gray-900">{config.label} — {display}</p>
      </div>
      {description && (
        <div className="px-4 pb-4">
          <div className="bg-green-50 border-l-2 border-green-400 rounded-r-lg px-3 py-2.5">
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Hybrid Summary ───────────────────────────────────────────────────────────
function HybridSummary({ traits, hybridName, plant1Name, plant2Name }) {
  const { height, growth_days, resistance, yield_level, climate, flower_color } = traits

  const growthCat =
    parseFloat(growth_days) < 90  ? 'fast-maturing' :
    parseFloat(growth_days) < 150 ? 'medium-cycle'  : 'long-cycle'

  const heightCat =
    parseFloat(height) < 80  ? 'compact' :
    parseFloat(height) < 180 ? 'medium-height' : 'tall'

  const yieldNote =
    ['High', 'Very High'].includes(yield_level) ? 'excellent commercial potential' :
    yield_level === 'Low'                        ? 'niche or research use'         :
                                                   'moderate commercial viability'

  return (
    <div className="px-2 py-3 mb-4 text-sm text-gray-700 leading-relaxed">
      <strong>{hybridName}</strong> is an AI-predicted hybrid of{' '}
      <span className="text-green-700 font-medium">{plant1Name}</span> and{' '}
      <span className="text-green-700 font-medium">{plant2Name}</span> — a{' '}
      <strong>{heightCat}</strong>, <strong>{growthCat}</strong> plant suited to{' '}
      <strong>{climate}</strong> conditions, producing{' '}
      <strong>{flower_color?.toLowerCase()}</strong> flowers with{' '}
      <strong>{resistance?.toLowerCase()}</strong> disease resistance and{' '}
      <strong>{yield_level?.toLowerCase()}</strong> yield ({yieldNote}).
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResultPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  if (!state?.result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">No Result Found</h2>
        <p className="text-gray-500 mb-6 max-w-sm">Navigate here from the Predict page.</p>
        <Link to="/predict" className="btn-primary">🌱 Go to Prediction</Link>
      </div>
    )
  }

  const { result, plant1Name, plant2Name } = state
  const prediction   = result?.data || result
  const traits       = prediction?.traits             || {}
  const descriptions = prediction?.trait_descriptions || {}
  const hybridName   = prediction?.predicted_hybrid   || `${plant1Name} × ${plant2Name} Hybrid`
  const confidence   = prediction?.confidence
  const pDate        = prediction?.prediction_date    || new Date().toISOString().split('T')[0]

  const traitEntries = ORDERED_TRAITS.filter(
    k => traits[k] !== undefined && traits[k] !== null
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Success banner */}
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-6">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">ML Prediction Complete!</p>
            <p className="text-xs text-green-600">
              AI-powered hybrid analysis for <strong>{plant1Name}</strong> × <strong>{plant2Name}</strong>
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{hybridName}</h2>

          <PlantLineageImages
            prediction={prediction}
            plant1Name={plant1Name}
            plant2Name={plant2Name}
            hybridName={hybridName}
          />

          {traitEntries.length > 0 && (
            <HybridSummary
              traits={traits}
              hybridName={hybridName}
              plant1Name={plant1Name}
              plant2Name={plant2Name}
            />
          )}

          {traitEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {traitEntries.map(key => (
                <TraitCard
                  key={key}
                  traitKey={key}
                  value={traits[key]}
                  description={descriptions[key]}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 text-sm">
              No trait data returned. Ensure the ML service is running.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/predict')} className="btn-primary">
            New Prediction
          </button>
          <Link to="/history" className="btn-secondary">View History</Link>
          <button onClick={() => window.print()} className="btn-secondary">Print</button>
        </div>

      </div>
    </div>
  )
}