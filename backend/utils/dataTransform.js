// utils/dataTransform.js
// Pure helper functions for formatting API responses.
// Rule-based hybrid computation has been removed — all predictions
// come from the Flask ML API (services/MLService.js).

'use strict'

// ── Trait description generators ─────────────────────────────────────────────
// Each function receives the predicted value and both parent plant objects,
// and returns a 1–2 sentence plain-English description of what that trait
// means for the hybrid plant.

const TRAIT_DESCRIPTIONS = {

  height: (value, plantA, plantB) => {
    const h = parseFloat(value)
    const category = h < 50  ? 'dwarf'
                   : h < 100 ? 'compact'
                   : h < 180 ? 'medium-sized'
                   : h < 250 ? 'tall'
                   :           'very tall'
    const pA = plantA?.height_cm, pB = plantB?.height_cm
    const parentNote = pA && pB
      ? ` This is a blend of ${plantA.plant_name} (${pA} cm) and ${plantB.plant_name} (${pB} cm).`
      : ''
    return `The hybrid will grow to approximately ${h} cm, making it a ${category} plant.${parentNote} This height influences spacing requirements and support structures needed during cultivation.`
  },

  leaf_shape: (value, plantA, plantB) => {
    const descriptions = {
      'Ovate':        'broad, egg-shaped leaves that are wider at the base and taper toward the tip',
      'Lanceolate':   'long, narrow lance-shaped leaves that taper to a pointed tip',
      'Elliptical':   'smooth oval leaves with rounded ends and a symmetrical shape',
      'Linear':       'long, very narrow grass-like leaves running parallel along the stem',
      'Palmate':      'large hand-shaped leaves with several lobes radiating from a central point',
      'Cordate':      'heart-shaped leaves with a notched base and rounded tip',
      'Oblong':       'elongated rectangular leaves with nearly parallel sides',
      'Pinnate':      'compound leaves with multiple leaflets arranged along a central stalk',
      'Spatulate':    'spoon-shaped leaves that are narrow at the base and broad at the tip',
      'Compound':     'leaves divided into multiple distinct leaflets on a shared stalk',
      'Lobed':        'leaves with deep rounded or pointed indentations along the edges',
      'Intermediate': 'leaves showing a blend of both parent leaf shapes',
      'Needle-like':  'thin, needle-shaped leaves adapted for minimal water loss',
    }
    const desc = descriptions[value] || `${value.toLowerCase()} shaped leaves`
    const inherited = (plantA?.leaf_shape === plantB?.leaf_shape)
      ? `Both parents share this leaf type, making it a stable inherited trait.`
      : `This shape is an intermediate result from the two parent leaf forms.`
    return `The hybrid will exhibit ${desc}. ${inherited} Leaf shape affects photosynthesis efficiency, water retention, and overall plant aesthetics.`
  },

  flower_color: (value, plantA, plantB) => {
    const colorMeanings = {
      'White':        'purity and neutrality, often attractive to nocturnal pollinators like moths',
      'Yellow':       'brightness and high visibility, strongly attractive to bees and butterflies',
      'Purple':       'richness and complexity, appealing to bees with ultraviolet vision',
      'Pink':         'softness and gentle appeal, popular with bumblebees and hoverflies',
      'Red':          'vibrancy and energy, particularly attractive to hummingbirds',
      'Orange':       'warmth and vitality, attracting a wide variety of pollinators',
      'Blue':         'rarity and coolness, highly attractive to honeybees',
      'Intermediate': 'a blended hue combining traits from both parent flowers',
    }
    const meaning = colorMeanings[value] || 'unique coloring inherited from parent plants'
    const pA = plantA?.flower_color, pB = plantB?.flower_color
    const blendNote = (pA && pB && pA !== pB)
      ? ` The color is a genetic blend of ${pA} (${plantA.plant_name}) and ${pB} (${plantB.plant_name}).`
      : ''
    return `The hybrid will produce ${value.toLowerCase()} flowers, symbolising ${meaning}.${blendNote} Flower color directly impacts pollinator attraction and ornamental value.`
  },

  climate: (value, plantA, plantB) => {
    const climateInfo = {
      'Tropical':            { zone: 'hot and humid regions', temp: '20–35°C', rain: 'heavy rainfall year-round' },
      'Subtropical':         { zone: 'warm regions with mild winters', temp: '15–30°C', rain: 'moderate to high rainfall' },
      'Temperate':           { zone: 'moderate four-season regions', temp: '10–25°C', rain: 'moderate and evenly distributed rainfall' },
      'Mediterranean':       { zone: 'regions with dry summers and wet winters', temp: '10–28°C', rain: 'seasonal rainfall concentrated in winter' },
      'Arid':                { zone: 'dry desert-like regions', temp: '15–40°C', rain: 'very low rainfall under 250mm/year' },
      'Semi-Arid':           { zone: 'grasslands and steppes', temp: '10–35°C', rain: 'low to moderate seasonal rainfall' },
      'Cool Temperate':      { zone: 'cooler four-season regions', temp: '5–20°C', rain: 'moderate and consistent rainfall' },
      'Moderate':            { zone: 'balanced climate zones', temp: '12–26°C', rain: 'regular and balanced rainfall' },
      'Tropical/Subtropical':{ zone: 'both tropical and subtropical zones', temp: '18–35°C', rain: 'high to very high rainfall' },
      'Tropical/Temperate':  { zone: 'versatile environments across tropical and temperate zones', temp: '15–32°C', rain: 'variable rainfall' },
    }
    const info = climateInfo[value] || { zone: 'varied climatic regions', temp: 'varies', rain: 'variable rainfall' }
    return `This hybrid is best suited for ${info.zone} with temperatures of ${info.temp} and ${info.rain}. It has inherited climate adaptability from both parent species, making it viable for cultivation in ${value} conditions.`
  },

  resistance: (value, plantA, plantB) => {
    const levels = {
      'Low':       { text: 'susceptible to most common pathogens and pests', advice: 'Regular fungicide and pesticide treatments will be necessary. Close monitoring and preventive care are essential.' },
      'Moderate':  { text: 'average resistance to common plant diseases and pests', advice: 'Standard agricultural practices and periodic preventive treatments will maintain plant health effectively.' },
      'High':      { text: 'strong natural defenses against most pathogens and environmental stressors', advice: 'Minimal chemical intervention needed. Good agricultural hygiene is sufficient for healthy growth.' },
      'Very High': { text: 'exceptional resistance to a broad spectrum of diseases and pests', advice: 'This hybrid can thrive with organic farming methods and requires very little chemical protection.' },
    }
    const info = levels[value] || { text: 'moderate resistance', advice: 'Standard care practices are recommended.' }
    const pA = plantA?.resistance, pB = plantB?.resistance
    const parentNote = (pA && pB && pA !== pB)
      ? ` The ${value} resistance is an improved trait over the weaker parent (${pA === 'Low' || pA === 'Moderate' ? plantA.plant_name : plantB.plant_name}).`
      : ''
    return `The hybrid shows ${value.toLowerCase()} disease resistance, meaning it is ${info.text}.${parentNote} ${info.advice}`
  },

  growth_days: (value, plantA, plantB) => {
    const days = parseFloat(value)
    const category = days < 60  ? 'very fast-maturing (early season)'
                   : days < 90  ? 'fast-maturing (early to mid season)'
                   : days < 120 ? 'medium-duration (mid season)'
                   : days < 180 ? 'slow-maturing (late season)'
                   :              'very long-cycle (multi-season)'
    const seasons = days < 90 ? 'a single growing season' : days < 180 ? 'one full season' : 'multiple seasons or years'
    return `The hybrid requires approximately ${Math.round(days)} days from germination to full maturity, classifying it as ${category}. It is suitable for ${seasons} of cultivation. This growth duration helps farmers plan sowing and harvesting schedules effectively.`
  },

  yield_level: (value, plantA, plantB) => {
    const yieldInfo = {
      'Low':       { output: 'a modest harvest output',      commercial: 'not ideal for large-scale commercial farming but suitable for home gardens and research plots' },
      'Moderate':  { output: 'an average harvest output',    commercial: 'suitable for small to medium-scale farming with standard inputs' },
      'Medium':    { output: 'a balanced harvest output',    commercial: 'suitable for medium-scale cultivation with moderate resource investment' },
      'High':      { output: 'an above-average crop yield',  commercial: 'well-suited for commercial farming with good return on investment' },
      'Very High': { output: 'an exceptionally large harvest', commercial: 'ideal for high-intensity commercial agriculture, offering excellent productivity per hectare' },
    }
    const info = yieldInfo[value] || { output: 'a standard yield', commercial: 'suitable for general cultivation' }
    const pA = plantA?.yield_level, pB = plantB?.yield_level
    const hybridVigor = (pA === 'High' || pA === 'Very High' || pB === 'High' || pB === 'Very High')
      ? ' Hybrid vigor (heterosis) from the parent combination contributes to this strong yield potential.'
      : ''
    return `The hybrid is expected to produce ${info.output}, rated as ${value}.${hybridVigor} It is ${info.commercial}, making it a ${value.toLowerCase() === 'very high' || value.toLowerCase() === 'high' ? 'highly valuable' : 'practical'} choice for cultivation.`
  },
}

/**
 * Generate a descriptions object for all 7 traits.
 * @param {Object} traits  - predicted trait values { height, leaf_shape, ... }
 * @param {Object} plantA  - parent plant A document
 * @param {Object} plantB  - parent plant B document
 * @returns {Object}       - { height: "...", leaf_shape: "...", ... }
 */
const generateTraitDescriptions = (traits, plantA, plantB) => {
  const result = {}
  for (const [key, fn] of Object.entries(TRAIT_DESCRIPTIONS)) {
    const value = traits[key]
    if (value !== undefined && value !== null) {
      try {
        result[key] = fn(value, plantA, plantB)
      } catch {
        result[key] = `Predicted value: ${value}`
      }
    }
  }
  return result
}

// ── Other helpers ─────────────────────────────────────────────────────────────

const deriveHybridName = (nameA, nameB) => {
  const wordsA = (nameA || '').split(' ')
  const wordsB = (nameB || '').split(' ')
  if (wordsA[0] && wordsA[0] === wordsB[0]) return `${wordsA[0]} × hybrid`
  return `${nameA} × ${nameB} hybrid`
}

const formatPlant = (plant) => ({
  _id:          plant._id,
  plant_name:   plant.plant_name,
  common_name:  plant.common_name,
  height_cm:    plant.height_cm,
  leaf_shape:   plant.leaf_shape,
  flower_color: plant.flower_color,
  climate:      plant.climate,
  resistance:   plant.resistance,
  growth_days:  plant.growth_days,
  yield_level:  plant.yield_level,
  family:       plant.family,
  origin:       plant.origin,
})

const formatHistory = (record) => ({
  _id:                record._id,
  plantA:             record.plantA,
  plantB:             record.plantB,
  plantA_data:        record.plantA_data || null,   
  plantB_data:        record.plantB_data || null, 
  predicted_hybrid:   record.predicted_hybrid,
  predicted_traits:   record.predicted_traits,
  trait_descriptions: record.trait_descriptions || {},
  hybrid_image_url:   record.hybrid_image_url || '', 
  prediction_source:  record.prediction_source,
  prediction_date:    record.prediction_date,
  createdAt:          record.createdAt,
})

/**
 * Build the standard prediction API response object.
 * Now includes trait_descriptions alongside raw trait values.
 */
const buildPredictionResponse = ({ plantA, plantB, traits, hybridName, source, plantADoc, plantBDoc }) => {
  const descriptions = generateTraitDescriptions(traits, plantADoc, plantBDoc)
  return {
    plantA:              plantA,
    plantB:              plantB,
    predicted_hybrid:    hybridName || deriveHybridName(plantA, plantB),
    traits: {
      height:       traits.height,
      leaf_shape:   traits.leaf_shape,
      flower_color: traits.flower_color,
      climate:      traits.climate,
      resistance:   traits.resistance,
      growth_days:  traits.growth_days,
      yield_level:  traits.yield_level,
    },
    trait_descriptions:  descriptions,
    prediction_date:     new Date().toISOString().split('T')[0],
    source,
  }
}

module.exports = {
  deriveHybridName,
  generateTraitDescriptions,
  formatPlant,
  formatHistory,
  buildPredictionResponse,
}










