# 🌿 Hybrid Plant Prediction System — Backend

Node.js + Express + MongoDB backend for the Intelligent Hybrid Plant Prediction System.

---

## Architecture

```
server.js
│
└─► Routes  →  Controllers  →  Services  →  Models  →  MongoDB
                                     └────→  ML API (Flask)
```

### Folder Structure

```
hybrid-plant-backend/
├── server.js                     ← Entry point
├── package.json
├── .env.example                  ← Copy to .env
├── config/
│   └── db.js                     ← MongoDB connection (retry + graceful shutdown)
├── models/
│   ├── Plant.js                  ← Plant schema (8 fields + virtuals + static)
│   └── PredictionHistory.js      ← History schema (parent snaps + 7 predicted traits)
├── controllers/
│   ├── PlantController.js        ← getAllPlants, getPlantByName
│   └── PredictionController.js   ← predictHybrid, getHistory, getHistoryById
├── services/
│   ├── PlantService.js           ← MongoDB queries for plants
│   ├── MLService.js              ← Axios → Flask ML API + rule-based fallback
│   └── HistoryService.js         ← CRUD for PredictionHistory
├── routes/
│   ├── plantRoutes.js            ← GET /plants, GET /plants/:name
│   ├── predictionRoutes.js       ← POST /predict, GET /history
│   └── healthRoutes.js           ← GET /health
├── middleware/
│   ├── errorHandler.js           ← Global error handler (dev vs prod)
│   ├── requestLogger.js          ← Morgan HTTP logging
│   ├── validateRequest.js        ← Input validation middleware
│   └── notFound.js               ← 404 catcher
├── utils/
│   ├── AppError.js               ← Custom operational error class
│   ├── asyncHandler.js           ← Async route wrapper (no try/catch repetition)
│   └── dataTransform.js          ← Rule-based hybrid logic + response formatters
└── data/
    ├── plant_dataset.json        ← 35 plant records
    └── seed.js                   ← MongoDB seeder script
```

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- (Optional) Flask ML API running on port 8000

### 2. Install

```bash
cd hybrid-plant-backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/hybrid_plant_db
ML_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Seed the database

```bash
npm run seed              # insert plants (skips if already seeded)
npm run seed:fresh        # drop + re-insert all 35 plants
```

### 5. Start the server

```bash
npm run dev     # nodemon — auto-restarts on file changes
npm start       # production mode
```

Server starts at **http://localhost:5000**

---

## API Reference

All endpoints return JSON. Errors also return JSON with `success: false`.

### Base URL

```
http://localhost:5000/api
```

---

### GET /api/plants

Returns all plants.

**Query params** (all optional):

| Param   | Type   | Description                              |
|---------|--------|------------------------------------------|
| limit   | number | Max records (default 100, max 500)       |
| skip    | number | Offset for pagination (default 0)        |
| climate | string | Filter by climate (case-insensitive)     |
| family  | string | Filter by plant family                   |
| search  | string | Full-text search on name/family          |

**Response:**

```json
{
  "success": true,
  "count": 35,
  "total": 35,
  "data": [
    {
      "_id": "...",
      "plant_name": "Petunia axillaris",
      "common_name": "White Petunia",
      "height_cm": 35,
      "leaf_shape": "Ovate",
      "flower_color": "White",
      "climate": "Temperate",
      "resistance": "Moderate",
      "growth_days": 80,
      "yield_level": "Moderate",
      "family": "Solanaceae",
      "origin": "South America"
    }
  ]
}
```

---

### GET /api/plants/:name

Fetch a single plant by scientific name (URL-encode spaces as `%20`).

**Example:** `GET /api/plants/Solanum%20lycopersicum`

**Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error (404):**

```json
{
  "success": false,
  "status": "fail",
  "code": "PLANT_NOT_FOUND",
  "message": "Plant \"Solanum xyz\" not found in the database"
}
```

---

### POST /api/predict

Predict the traits of a hybrid plant from two parents.

**Request body** — use **one** of these formats:

#### Option A — MongoDB ObjectIds (recommended, used by the React frontend)

```json
{
  "plant1Id": "64abc1234567890abcdef001",
  "plant2Id": "64abc1234567890abcdef002"
}
```

#### Option B — Scientific names

```json
{
  "plantA": "Petunia axillaris",
  "plantB": "Petunia integrifolia"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plantA": "Petunia axillaris",
    "plantB": "Petunia integrifolia",
    "predicted_hybrid": "Petunia × hybrid",
    "traits": {
      "height": 40,
      "leaf_shape": "Ovate",
      "flower_color": "Intermediate",
      "climate": "Temperate",
      "resistance": "High",
      "growth_days": 88,
      "yield_level": "High"
    },
    "prediction_date": "2026-03-16",
    "source": "ml_api"
  },
  "history_id": "64abc1234567890abcdef099"
}
```

> `source` is `"ml_api"` when the Flask ML API responded, or `"rule_based"` when it was unreachable and the built-in algorithm was used.

---

### GET /api/history

Retrieve all past predictions, newest first.

**Query params:** `limit`, `skip`

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "data": [
    {
      "_id": "...",
      "plantA": "Petunia axillaris",
      "plantB": "Petunia integrifolia",
      "predicted_hybrid": "Petunia × hybrid",
      "predicted_traits": { "height": 40, ... },
      "prediction_source": "ml_api",
      "prediction_date": "2026-03-16",
      "createdAt": "2026-03-16T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/history/:id

Retrieve a single history record by its MongoDB `_id`.

---

### GET /health

System health check.

```json
{
  "status": "ok",
  "timestamp": "2026-03-16T10:00:00.000Z",
  "uptime_s": 3600,
  "node_env": "development",
  "services": {
    "database": "connected",
    "ml_api": "ok"
  }
}
```

---

## Postman Testing

### Collection — Manual Test Cases

#### 1. Seed check — list all plants
```
GET http://localhost:5000/api/plants
```

#### 2. Filter by climate
```
GET http://localhost:5000/api/plants?climate=Tropical&limit=5
```

#### 3. Get plant by name
```
GET http://localhost:5000/api/plants/Zea%20mays
```

#### 4. Predict using ObjectIds (get IDs from step 1 first)
```
POST http://localhost:5000/api/predict
Content-Type: application/json

{
  "plant1Id": "<_id from GET /plants>",
  "plant2Id": "<_id from GET /plants>"
}
```

#### 5. Predict using names
```
POST http://localhost:5000/api/predict
Content-Type: application/json

{
  "plantA": "Petunia axillaris",
  "plantB": "Petunia integrifolia"
}
```

#### 6. Get history
```
GET http://localhost:5000/api/history
```

#### 7. Health check
```
GET http://localhost:5000/health
```

---

## Flask ML API Integration

The backend calls your Flask ML API at `POST ${ML_API_URL}/predict`.

### Expected Flask request payload

```json
{
  "plantA": {
    "name": "Petunia axillaris",
    "height_cm": 35,
    "leaf_shape": "Ovate",
    "flower_color": "White",
    "climate": "Temperate",
    "resistance": "Moderate",
    "growth_days": 80,
    "yield_level": "Moderate"
  },
  "plantB": { ... }
}
```

### Expected Flask response

```json
{
  "predicted_hybrid": "Petunia hybrida",
  "traits": {
    "height": 40,
    "leaf_shape": "Ovate",
    "flower_color": "Purple",
    "climate": "Moderate",
    "resistance": "High",
    "growth_days": 88,
    "yield_level": "High"
  }
}
```

> If the Flask API is offline, the backend automatically falls back to a rule-based algorithm and marks `source: "rule_based"` in the response. **No configuration needed** — it just works.

---

## Frontend Integration

The React frontend's `src/api/plantApi.js` calls:

| Frontend call | Backend endpoint |
|---|---|
| `fetchPlants()` | `GET /api/plants` |
| `predictHybrid(id1, id2)` | `POST /api/predict` with `{ plant1Id, plant2Id }` |
| `fetchHistory()` | `GET /api/history` |

The Vite dev proxy (`/api → http://localhost:5000`) handles CORS automatically during development. In production, set `ALLOWED_ORIGINS` in `.env`.

---

## Error Response Format

All errors return consistent JSON:

```json
{
  "success": false,
  "status": "fail",
  "code": "PLANT_NOT_FOUND",
  "message": "Plant \"xyz\" not found in the database"
}
```

| Code | Status | Meaning |
|---|---|---|
| `MISSING_PLANTS` | 400 | No plant identifiers in request body |
| `INVALID_OBJECT_ID` | 400 | ID param is not a valid ObjectId |
| `SAME_PLANT` | 400 | Both plants are the same |
| `PLANT_NOT_FOUND` | 404 | Plant name/ID not in database |
| `HISTORY_NOT_FOUND` | 404 | History record ID not found |
| `ROUTE_NOT_FOUND` | 404 | URL doesn't match any route |
| `DUPLICATE_KEY` | 409 | Unique constraint violation |
| `VALIDATION_ERROR` | 400 | Mongoose schema validation failed |
