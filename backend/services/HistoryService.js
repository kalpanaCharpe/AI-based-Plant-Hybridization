// services/HistoryService.js
// Manages creation and retrieval of PredictionHistory documents.

'use strict'

const PredictionHistory = require('../models/PredictionHistory')
const AppError          = require('../utils/AppError')

class HistoryService {
  /**
   * Persist a new prediction to the database.
   *
   * @param {Object} opts
   * @param {Object} opts.plantA         - Full plant A document
   * @param {Object} opts.plantB         - Full plant B document
   * @param {Object} opts.traits         - Predicted trait object
   * @param {string} opts.hybridName     - Predicted hybrid display name
   * @param {string} opts.source         - 'ml_api'
   * @returns {PredictionHistory}        - Saved Mongoose document
   */
  async save({ plantA, plantB, traits, hybridName, source, traitDescriptions, hybridImageUrl }) {
    const record = await PredictionHistory.create({
      plantA:           plantA.plant_name,
      plantB:           plantB.plant_name,
      plantA_data:      plantA,
      plantB_data:      plantB,
      predicted_hybrid: hybridName || '',
      predicted_traits:    traits,
      trait_descriptions:   traitDescriptions || {},
      hybrid_image_url:   hybridImageUrl || '',
      prediction_source:    source || 'ml_api',
      prediction_date:  new Date().toISOString().split('T')[0],
    })
    return record
  }

  /**
   * Return all prediction history, newest first.
   * Supports pagination via limit / skip.
   */
  async getAll({ limit = 50, skip = 0 } = {}) {
    const [records, total] = await Promise.all([
      PredictionHistory.find()
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      PredictionHistory.countDocuments(),
    ])
    return { records, total }
  }

  /**
   * Return a single history record by its MongoDB _id.
   * Throws 404 if not found.
   */
  async getById(id) {
    const record = await PredictionHistory.findById(id).lean()
    if (!record) throw new AppError(`Prediction history "${id}" not found`, 404, 'HISTORY_NOT_FOUND')
    return record
  }

  /**
   * Return all history records involving a given plant name.
   */
  async getByPlant(name) {
    const regex = new RegExp(name, 'i')
    return PredictionHistory.find({ $or: [{ plantA: regex }, { plantB: regex }] })
      .sort({ createdAt: -1 })
      .lean()
  }
}

module.exports = new HistoryService()