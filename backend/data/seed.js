// data/seed.js
// Seeds the MongoDB database with the plant dataset.
// Usage:
//   node data/seed.js          → insert if collection is empty
//   node data/seed.js --fresh  → drop collection then re-insert

'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const mongoose = require('mongoose')
const Plant    = require('../models/Plant')
const plants   = require('./plant_dataset.json')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hybrid_plant_db'
const isFresh   = process.argv.includes('--fresh')

;(async () => {
  try {
    console.log('🌱  Connecting to MongoDB…')
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    console.log(`✅  Connected → ${mongoose.connection.host}`)

    if (isFresh) {
      await Plant.deleteMany({})
      // console.log('🗑️   Existing plant records cleared (--fresh flag).')
    } else {
      const count = await Plant.countDocuments()
      if (count > 0) {
        // console.log(`ℹ️   Database already has ${count} plants. Use --fresh to re-seed. Exiting.`)
        process.exit(0)
      }
    }

    // Upsert each plant by plant_name so re-runs are safe
    let inserted = 0
    let updated  = 0

    for (const plantData of plants) {
      const result = await Plant.findOneAndUpdate(
        { plant_name: plantData.plant_name },
        plantData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      if (result.__v === undefined || isFresh) inserted++
      else updated++
    }

    // console.log(`🎉  Seed complete — ${plants.length} plants processed.`)
    // console.log(`    ✔ Inserted/updated: ${plants.length}`)

    // Show summary
    const total = await Plant.countDocuments()
    // console.log(`    📊 Total plants in DB: ${total}`)

    process.exit(0)
  } catch (err) {
    // console.error('❌  Seeding failed:', err.message)
    process.exit(1)
  }
})()
