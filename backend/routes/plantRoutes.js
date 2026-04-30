// routes/plantRoutes.js
// All plant-related endpoints.

'use strict'

const express = require('express')
const router  = express.Router()

const { getAllPlants, getPlantByName } = require('../controllers/PlantController')
const { validateNameParam, validatePagination } = require('../middleware/validateRequest')

router.get('/', validatePagination, getAllPlants)

router.get('/:name', validateNameParam, getPlantByName)

module.exports = router
