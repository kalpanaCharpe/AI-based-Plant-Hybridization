// PredictPage.jsx
// Fetches plants, shows two dropdowns, sends _id pair to POST /predict

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlants, predictHybrid } from '../api/plantApi'
import PlantDropdown from '../components/PlantDropdown'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

export default function PredictPage() {
  const navigate = useNavigate()

  const [plants, setPlants]           = useState([])
  const [plant1Id, setPlant1Id]       = useState('')
  const [plant2Id, setPlant2Id]       = useState('')
  const [loadingPlants, setLoadingPlants] = useState(true)
  const [predicting, setPredicting]   = useState(false)
  const [plantsError, setPlantsError] = useState(null)
  const [predictError, setPredictError] = useState(null)

  const loadPlants = async () => {
    setLoadingPlants(true)
    setPlantsError(null)
    try {
      const data = await fetchPlants()
      // fetchPlants() already unwraps the envelope — should be a plain array
      setPlants(Array.isArray(data) ? data : [])
    } catch (err) {
      setPlantsError(err.message)
    } finally {
      setLoadingPlants(false)
    }
  }

  useEffect(() => { loadPlants() }, [])

  const handlePredict = async () => {
    if (!plant1Id || !plant2Id) return
    setPredicting(true)
    setPredictError(null)
    try {
      // Send MongoDB _ids — backend expects { plant1Id, plant2Id }
      const result = await predictHybrid(plant1Id, plant2Id)

      // Resolve display names for the result page
      const plant1Name = plants.find((p) => (p._id || p.id) === plant1Id)?.plant_name || plant1Id
      const plant2Name = plants.find((p) => (p._id || p.id) === plant2Id)?.plant_name || plant2Id

      navigate('/result', {
        state: { result, plant1Name, plant2Name },
      })
    } catch (err) {
      setPredictError(err.message)
      setPredicting(false)
    }
  }

  const canPredict = plant1Id && plant2Id && plant1Id !== plant2Id && !predicting

  return (
    <div className="min-h-screen bg-organic py-10 px-4 sm:px-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-forest-600 font-semibold text-sm uppercase tracking-widest mb-2"></p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-sage-900">
            Select Parent Plants
          </h1>
          <p className="text-sage-500 mt-2 text-base">
            Choose two different parent plants to generate a hybrid prediction.
          </p>
        </div>

        {/* Main Card */}
        <div className="card shadow-md">
          {loadingPlants ? (
            <Spinner text="Fetching plant database..." />
          ) : plantsError ? (
            <ErrorMessage message={plantsError} onRetry={loadPlants} />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Dropdowns */}
              <PlantDropdown
                label="Parent Plant 1"
                plants={plants}
                value={plant1Id}
                onChange={setPlant1Id}
                disabled={predicting}
                exclude={plant2Id}
              />

              {/* Cross divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-sage-200" />
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sage-400 text-lg flex-shrink-0">
                  ✕
                </div>
                <div className="flex-1 h-px bg-sage-200" />
              </div>

              <PlantDropdown
                label="Parent Plant 2"
                plants={plants}
                value={plant2Id}
                onChange={setPlant2Id}
                disabled={predicting}
                exclude={plant1Id}
              />

              {plant1Id && plant2Id && plant1Id === plant2Id && (
                <p className="text-amber-600 text-sm flex items-center gap-2">
                  <span>⚠️</span> Please select two different plants.
                </p>
              )}

              {predictError && (
                <ErrorMessage message={predictError} onRetry={handlePredict} />
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handlePredict}
                  disabled={!canPredict}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-base py-3.5"
                >
                  {predicting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>Predict Hybrid</>
                  )}
                </button>
                <button
                  onClick={() => { setPlant1Id(''); setPlant2Id('') }}
                  disabled={predicting}
                  className="btn-secondary flex-shrink-0"
                >
                  Reset
                </button>
              </div>

              {plants.length > 0 && (
                <p className="text-xs text-center text-sage-400">
                  {plants.length} plants available in database
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
