// HistoryPage.jsx
// fetchHistory() returns the array directly (envelope already unwrapped in plantApi.js)
// Backend record shape: { _id, plantA, plantB, predicted_traits: {...}, createdAt, ... }

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import HistoryTable from '../components/HistoryTable'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import { fetchHistory } from '../api/plantApi'

export default function HistoryPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const loadHistory = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchHistory()
      .then((data) => {
        // fetchHistory() returns the unwrapped array directly
        setRecords(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  return (
    <div className="min-h-screen bg-organic py-10 px-4 sm:px-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-sage-900 mb-1">
              Prediction History
            </h1>
            {/* <p className="text-sage-500">All past hybrid predictions stored in MongoDB.</p> */}
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="btn-secondary text-s px-4 py-1"
            >
              Refresh
            </button>
            <Link to="/predict" className="btn-primary text-s px-4 py-1">
              New Prediction
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-md">
          {loading  ? <Spinner text="Fetching prediction history…" size="lg" /> :
           error    ? <ErrorMessage message={error} onRetry={loadHistory} /> :
                      <HistoryTable records={records} />}
        </div>

        {!loading && !error && records.length === 0 && (
          <div className="text-center mt-6">
            <Link to="/predict" className="btn-primary inline-flex gap-2">
              🌱 Make Your First Prediction
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
