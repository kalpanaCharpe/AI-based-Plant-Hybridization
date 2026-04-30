// PlantDropdown.jsx
// Backend sends: { _id, plant_name, common_name, climate, origin, family, ... }

export default function PlantDropdown({ label, plants, value, onChange, disabled, exclude }) {
  // Safely resolve id and display name regardless of backend field name
  const getId   = (p) => p._id        || p.id        || p.plant_name || p.name || ''
  const getName = (p) => p.plant_name || p.name      || p.common_name || getId(p)

  const filteredPlants = exclude
    ? plants.filter((p) => getId(p) !== exclude)
    : plants

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-sage-700 tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || plants.length === 0}
          className="select-field pr-10"
        >
          <option value="">— Select a plant —</option>
          {filteredPlants.map((plant) => {
            const id   = getId(plant)
            const name = getName(plant)
            // Show common name in parentheses if different from scientific name
            const extra = plant.common_name && plant.common_name !== name
              ? ` (${plant.common_name})`
              : ''
            return (
              <option key={id} value={id}>
                {name}{extra}
              </option>
            )
          })}
        </select>
        {/* Chevron icon */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {value && (
        <PlantInfoBadge plant={filteredPlants.find((p) => getId(p) === value)} />
      )}
    </div>
  )
}

function PlantInfoBadge({ plant }) {
  if (!plant) return null
  return (
    <div className="flex flex-wrap gap-2 mt-1 animate-fade-in">
      {plant.family && (
        <span className="badge bg-forest-50 text-forest-700 border border-forest-200">
          🌿 {plant.family}
        </span>
      )}
      {plant.climate && (
        <span className="badge bg-sky-50 text-sky-700 border border-sky-200">
          ☀️ {plant.climate}
        </span>
      )}
      {plant.origin && (
        <span className="badge bg-earth-50 text-earth-700 border border-earth-200">
          📍 {plant.origin}
        </span>
      )}
      {plant.resistance && (
        <span className="badge bg-green-50 text-green-700 border border-green-200">
          🛡️ {plant.resistance}
        </span>
      )}
    </div>
  )
}
