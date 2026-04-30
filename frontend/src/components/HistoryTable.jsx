// // HistoryTable.jsx
// // Backend record shape:
// //   { _id, plantA, plantB, predicted_hybrid, predicted_traits, trait_descriptions,
// //     hybrid_image_url, plantA_data, plantB_data, prediction_date, createdAt }

import { useEffect, useState, useMemo} from 'react'
import { Link } from 'react-router-dom'

const TRAIT_CONFIG = {
  height:       { label: 'Height',             unit: 'cm'   },
  leaf_shape:   { label: 'Leaf Shape'                       },
  flower_color: { label: 'Flower Color'                     },
  climate:      { label: 'Climate'                          },
  resistance:   { label: 'Disease Resistance'               },
  growth_days:  { label: 'Growth Duration',    unit: 'days' },
  yield_level:  { label: 'Yield Level'                      },
}

const ORDERED_TRAITS = ['height','leaf_shape','flower_color','climate','resistance','growth_days','yield_level']

function formatDate(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return str }
}

// ── Single trait card in expanded history row ─────────────────────────────────
function HistoryTraitCard({ traitKey, value, description }) {
  const config  = TRAIT_CONFIG[traitKey] || { label: traitKey }
  const display = config.unit ? `${value} ${config.unit}` : String(value ?? '—')
  return (
    <div className="bg-white border border-forest-100 rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <p className="text-s font-bold text-sage-900">{config.label} - {display}</p>
      </div>
      {description && (
        <div className="px-3 pb-3">
          <div className="bg-forest-50 border-l-2 border-forest-400 rounded-r-md px-2.5 py-2">
            <p className="text-s text-forest-800 leading-relaxed">{description}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Same proxy URL builder as ResultPage ──────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || '/api'

function buildProxyUrl({ plant1Name, plant2Name, traits }) {
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

  const seed = (plant1Name + plant2Name)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 99999

  return `${API_BASE}/generate-image?prompt=${encodeURIComponent(prompt)}&seed=${seed}`
}

// ── Plant lineage images for history (Pollinations AI — same as ResultPage) ────
function HistoryLineageImages({ record }) {
  const plantAImageUrl = record.plantA_data?.image_url || ''
  const plantBImageUrl = record.plantB_data?.image_url || ''
  const hybridName     = record.predicted_hybrid || `${record.plantA} × ${record.plantB} Hybrid`
  const traits         = record.predicted_traits || {}

  const [imgStatus, setImgStatus] = useState('loading')

  const hybridUrl = useMemo(
    () => buildProxyUrl({ plant1Name: record.plantA, plant2Name: record.plantB, traits }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record.plantA, record.plantB]
  )

  if (!record.plantA && !record.plantB) return null

  const imgBox = (src, label, sublabel) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-sage-200 bg-sage-50 shadow-sm">
        {src
          ? <img src={src} alt={label} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl bg-sage-50">🌱</div>
        }
      </div>
      <p className="text-xs text-center font-medium text-sage-700 leading-tight line-clamp-2 w-full px-0.5">{label}</p>
      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sage-100 text-sage-500">{sublabel}</span>
    </div>
  )

  const hybridBox = (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-forest-400 ring-2 ring-forest-200 ring-offset-1 shadow-md">
        {imgStatus === 'loading' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-forest-50">
            <div className="w-5 h-5 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] text-forest-500 text-center px-1">Generating AI image…</p>
          </div>
        )}
        {imgStatus === 'error' && (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-forest-50 to-earth-50">🧬</div>
        )}
        <img
          src={hybridUrl}
          alt={`AI hybrid: ${hybridName}`}
          className="w-full h-full object-cover"
          style={{ display: imgStatus === 'done' ? 'block' : 'none' }}
          onLoad={()  => setImgStatus('done')}
          onError={() => setImgStatus('error')}
        />
      </div>
      <p className="text-xs text-center font-semibold text-forest-800 leading-tight line-clamp-2 w-full px-0.5">{hybridName}</p>
      <span className="text-[10px] bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full font-semibold">AI Hybrid</span>
    </div>
  )

  return (
    <div className="mb-5">
      {/* <p className="text-xs text-sage-400 font-semibold uppercase tracking-wider text-center mb-3">
        🌿 Plant Lineage
      </p> */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {imgBox(plantAImageUrl, record.plantA || 'Parent A', 'Parent A')}
        {hybridBox}
        {imgBox(plantBImageUrl, record.plantB || 'Parent B', 'Parent B')}
      </div>
    </div>
  )
}


// ── Expanded panel ────────────────────────────────────────────────────────────
function ExpandedPanel({ record }) {
  const traits       = record.predicted_traits   || {}
  const descriptions = record.trait_descriptions || {}
  const traitEntries = ORDERED_TRAITS.filter(k => traits[k] !== undefined && traits[k] !== null)
  const hasDesc      = Object.keys(descriptions).length > 0

  return (
    <tr className="bg-forest-50/30">
      <td colSpan={5} className="px-4 py-5">

        {/* Plant lineage images with Canvas blend */}
        <HistoryLineageImages record={record} />

        {/* No descriptions notice for old records */}
        {!hasDesc && (
          <div className="mb-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
            ℹ️ Descriptions are available for new predictions. Re-run this pair to generate them.
          </div>
        )}

        {/* Trait cards */}
        {traitEntries.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {traitEntries.map(key => (
              <HistoryTraitCard key={key} traitKey={key} value={traits[key]} description={descriptions[key]} />
            ))}
          </div>
        ) : (
          <p className="text-sage-400 text-sm text-center py-4">No trait data available.</p>
        )}
      </td>
    </tr>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────
export default function HistoryTable({ records }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🌱</div>
        <h3 className="font-display text-xl font-semibold text-sage-700 mb-2">No predictions yet</h3>
        <p className="text-sage-500 text-sm mb-6">Start your first hybrid plant prediction.</p>
        <Link to="/predict" className="btn-primary inline-block">Make a Prediction</Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-sage-200">
      <table className="w-full">
        <thead>
          <tr className="bg-forest-700 text-white">
            <th className="font-medium text-s text-left px-4 py-3 rounded-tl-2xl">S.No.</th>
            <th className="font-medium text-s text-left px-4 py-3">Parent Plant A</th>
            <th className="font-medium text-s text-left px-4 py-3">Parent Plant B</th>
            <th className="font-medium text-s text-left px-4 py-3 hidden md:table-cell">Date</th>
            <th className="font-medium text-s text-center px-4 py-3 rounded-tr-2xl">Details</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, idx) => {
            const id         = record._id || idx
            const isExpanded = expandedId === id

            return (
              <>
                <tr
                  key={id}
                  className={`border-t border-sage-100 hover:bg-forest-50/50 transition-colors cursor-pointer
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/20'}
                    ${isExpanded ? 'bg-forest-50/50' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                >
                  <td className="px-4 py-3.5 text-sage-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-forest-700 text-s font-medium">{record.plantA || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-forest-700 text-s font-medium">{record.plantB || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="font-mono text-xs text-sage-500">
                      {formatDate(record.createdAt || record.prediction_date)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      className={`text-xs font-medium px-3 py-1 rounded-lg transition-all border
                        ${isExpanded
                          ? 'bg-forest-600 text-white border-forest-600'
                          : 'bg-white text-forest-600 border-forest-200 hover:border-forest-400'}`}
                      onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : id) }}
                    >
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {isExpanded && <ExpandedPanel key={`exp-${id}`} record={record} />}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}