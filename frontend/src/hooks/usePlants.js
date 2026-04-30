// src/hooks/usePlants.js
import { useState, useEffect } from 'react'
import { fetchPlants } from '../api/plantApi'

export function usePlants() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPlants()
      .then((res) => {
        if (!cancelled) setPlants(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { plants, loading, error }
}
