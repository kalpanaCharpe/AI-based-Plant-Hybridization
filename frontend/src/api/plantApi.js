import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export const fetchPlants = async () => {
  const response = await apiClient.get('/plants')
  return response.data.data ?? response.data
}

export const predictHybrid = async (plant1Id, plant2Id) => {
  const response = await apiClient.post('/predict', { plant1Id, plant2Id })
  return response.data
}

export const fetchHistory = async () => {
  const response = await apiClient.get('/history')
  return response.data.data ?? response.data
}

export default apiClient