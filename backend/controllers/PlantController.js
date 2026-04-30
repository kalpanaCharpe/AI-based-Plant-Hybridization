// controllers/PlantController.js
// Handles HTTP request/response for plant-related endpoints.
// Delegates all business logic to PlantService.

'use strict'

const PlantService   = require('../services/PlantService')
const asyncHandler   = require('../utils/asyncHandler')
const { formatPlant } = require('../utils/dataTransform')

/**
 * GET /plants
 * Query params: limit, skip, climate, family, search
 *
 * Response: { success, count, total, data: Plant[] }
 */
const getAllPlants = asyncHandler(async (req, res) => {
  const { limit, skip, climate, family, search } = req.query
  const { plants, total } = await PlantService.getAll({ limit, skip, climate, family, search })

  res.status(200).json({
    success: true,
    count:   plants.length,
    total,
    data:    plants.map(formatPlant),
  })
})

/**
 * GET /plants/:name
 * URL param: name — scientific plant name (URL-encoded if spaces present)
 *
 * Response: { success, data: Plant }
 */
const getPlantByName = asyncHandler(async (req, res) => {
  const name  = decodeURIComponent(req.params.name)
  const plant = await PlantService.getByName(name)

  res.status(200).json({
    success: true,
    data:    formatPlant(plant),
  })
})

module.exports = { getAllPlants, getPlantByName }
