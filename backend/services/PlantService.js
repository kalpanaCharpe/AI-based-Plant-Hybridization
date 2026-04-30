// services/PlantService.js
// Handles all database interaction for the Plant model.
// Controllers call these methods; they never touch the model directly.

'use strict'

const Plant    = require('../models/Plant')
const AppError = require('../utils/AppError')

class PlantService {
  /**
   * Return all plants, sorted alphabetically.
   * Optional query params: limit, skip, climate, family
   */
  async getAll({ limit = 100, skip = 0, climate, family, search } = {}) {
    const filter = {}

    if (climate) filter.climate = new RegExp(climate, 'i')
    if (family)  filter.family  = new RegExp(family,  'i')
    if (search)  filter.$text   = { $search: search }

    const [plants, total] = await Promise.all([
      Plant.find(filter)
        .sort({ plant_name: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Plant.countDocuments(filter),
    ])

    return { plants, total }
  }

  /**
   * Find a single plant by its scientific name (case-insensitive).
   * Throws 404 AppError if not found.
   */
  async getByName(name) {
    if (!name || typeof name !== 'string') {
      throw new AppError('Plant name must be a non-empty string', 400, 'INVALID_NAME')
    }

    const plant = await Plant.findByName(name.trim()).lean()
    if (!plant) {
      throw new AppError(`Plant "${name}" not found in the database`, 404, 'PLANT_NOT_FOUND')
    }
    return plant
  }

  /**
   * Find a plant by its MongoDB _id.
   * Throws 404 AppError if not found.
   */
  async getById(id) {
    const plant = await Plant.findById(id).lean()
    if (!plant) {
      throw new AppError(`Plant with id "${id}" not found`, 404, 'PLANT_NOT_FOUND')
    }
    return plant
  }

  /**
   * Fetch two plants in parallel; throws if either is missing.
   * Accepts either scientific names or MongoDB ObjectIds.
   */
  async getPairByName(nameA, nameB) {
    const [plantA, plantB] = await Promise.all([
      this.getByName(nameA),
      this.getByName(nameB),
    ])

    if (plantA._id.toString() === plantB._id.toString()) {
      throw new AppError('Both plants must be different to predict a hybrid', 400, 'SAME_PLANT')
    }

    return { plantA, plantB }
  }

  /**
   * Fetch two plants by their MongoDB ObjectIds in parallel.
   */
  async getPairById(idA, idB) {
    const [plantA, plantB] = await Promise.all([
      this.getById(idA),
      this.getById(idB),
    ])

    if (plantA._id.toString() === plantB._id.toString()) {
      throw new AppError('Both plants must be different to predict a hybrid', 400, 'SAME_PLANT')
    }

    return { plantA, plantB }
  }
}

module.exports = new PlantService()
