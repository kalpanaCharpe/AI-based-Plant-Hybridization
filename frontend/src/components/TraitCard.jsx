const TRAIT_CONFIG = {
  height: { icon: '📏', label: 'Height', unit: 'cm', color: 'forest' },
  leafShape: { icon: '🍃', label: 'Leaf Shape', color: 'sage' },
  flowerColor: { icon: '🌸', label: 'Flower Color', color: 'pink' },
  climateAdaptability: { icon: '🌡️', label: 'Climate Adaptability', color: 'sky' },
  diseaseResistance: { icon: '🛡️', label: 'Disease Resistance', color: 'amber' },
  growthDuration: { icon: '⏳', label: 'Growth Duration', unit: 'days', color: 'violet' },
  yield: { icon: '🌾', label: 'Yield', unit: 'kg/ha', color: 'earth' },
}

const COLOR_MAP = {
  forest: { bg: 'bg-forest-50', border: 'border-forest-200', text: 'text-forest-700', label: 'text-forest-900', icon: 'bg-forest-100' },
  sage: { bg: 'bg-sage-50', border: 'border-sage-200', text: 'text-sage-600', label: 'text-sage-900', icon: 'bg-sage-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', label: 'text-pink-900', icon: 'bg-pink-100' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', label: 'text-sky-900', icon: 'bg-sky-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: 'text-amber-900', icon: 'bg-amber-100' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', label: 'text-violet-900', icon: 'bg-violet-100' },
  earth: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', label: 'text-orange-900', icon: 'bg-orange-100' },
}

export default function TraitCard({ traitKey, value }) {
  const config = TRAIT_CONFIG[traitKey] || { icon: '🌿', label: traitKey, color: 'sage' }
  const colors = COLOR_MAP[config.color] || COLOR_MAP.sage

  const displayValue = value !== null && value !== undefined ? String(value) : 'N/A'
  const displayWithUnit = config.unit ? `${displayValue} ${config.unit}` : displayValue

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-2xl p-5 flex flex-col gap-3 animate-slide-up transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center text-xl`}>
        {config.icon}
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${colors.text} mb-1`}>
          {config.label}
        </p>
        <p className={`text-lg font-bold ${colors.label} font-mono`}>
          {displayWithUnit}
        </p>
      </div>
    </div>
  )
}

export function TraitGrid({ traits }) {
  if (!traits) return null

  const knownKeys = Object.keys(TRAIT_CONFIG)
  const traitKeys = [
    ...knownKeys.filter((k) => traits[k] !== undefined),
    ...Object.keys(traits).filter((k) => !knownKeys.includes(k)),
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {traitKeys.map((key) => (
        <TraitCard key={key} traitKey={key} value={traits[key]} />
      ))}
    </div>
  )
}
