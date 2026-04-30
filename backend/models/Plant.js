// // models/Plant.js
// // Mongoose schema for a plant record in the dataset.

const mongoose = require('mongoose')

const plantSchema = new mongoose.Schema(
  {
    plant_name: {
      type: String,
      required: [true, 'plant_name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    common_name: {
      type: String,
      trim: true,
      default: '',
    },
    height_cm: {
      type: Number,
      required: [true, 'height_cm is required'],
      min: [1, 'height_cm must be > 0'],
    },
    leaf_shape: {
      type: String,
      required: [true, 'leaf_shape is required'],
      trim: true,
      enum: {
        values: [
          'Ovate', 'Lanceolate', 'Elliptical', 'Linear', 'Palmate',
          'Cordate', 'Oblong', 'Pinnate', 'Spatulate', 'Reniform',
          'Deltoid', 'Hastate', 'Sagittate', 'Lobed', 'Compound',
          'Needle-like', 'Scale-like', 'Intermediate',
        ],
        message: '{VALUE} is not a recognised leaf shape',
      },
    },
    flower_color: {
      type: String,
      required: [true, 'flower_color is required'],
      trim: true,
    },
    climate: {
      type: String,
      required: [true, 'climate is required'],
      trim: true,
      enum: {
        values: [
          'Tropical', 'Subtropical', 'Temperate', 'Mediterranean',
          'Arid', 'Semi-Arid', 'Cool Temperate', 'Moderate',
          'Tropical/Subtropical', 'Tropical/Temperate',
        ],
        message: '{VALUE} is not a recognised climate type',
      },
    },
    resistance: {
      type: String,
      required: [true, 'resistance is required'],
      enum: {
        values: ['Low', 'Moderate', 'High', 'Very High'],
        message: '{VALUE} is not a valid resistance level',
      },
    },
    growth_days: {
      type: Number,
      required: [true, 'growth_days is required'],
      min: [1, 'growth_days must be > 0'],
    },
    yield_level: {
      type: String,
      required: [true, 'yield_level is required'],
      enum: {
        values: ['Low', 'Moderate', 'Medium', 'High', 'Very High'],
        message: '{VALUE} is not a valid yield level',
      },
    },
    family: {
      type: String,
      trim: true,
      default: '',
    },
    origin: {
      type: String,
      trim: true,
      default: '',
    },
    // ── NEW: botanical image URL (Wikimedia Commons) ─────────────────────────
    image_url: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
)

plantSchema.index({ plant_name: 'text', common_name: 'text', family: 'text' })

plantSchema.virtual('displayName').get(function () {
  return this.common_name ? `${this.plant_name} (${this.common_name})` : this.plant_name
})

plantSchema.statics.findByName = function (name) {
  return this.findOne({ plant_name: { $regex: new RegExp(`^${name}$`, 'i') } })
}

module.exports = mongoose.model('Plant', plantSchema)