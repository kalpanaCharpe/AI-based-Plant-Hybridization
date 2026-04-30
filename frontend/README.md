# 🌿 Hybrid Plant Prediction System — Frontend

A React + Vite frontend for predicting hybrid plant traits using AI.

## Tech Stack

- **React 18** — UI library with functional components & hooks
- **Vite** — Fast dev server and bundler
- **React Router v6** — Client-side routing
- **Axios** — HTTP client for REST API calls
- **Tailwind CSS v3** — Utility-first styling

---

## Project Structure

```
src/
├── api/
│   └── plantApi.js          # Axios instance + all API methods
├── components/
│   ├── Navbar.jsx            # Sticky top nav with mobile menu
│   ├── Footer.jsx            # Footer with links and credits
│   ├── Spinner.jsx           # Loading spinner
│   ├── ErrorMessage.jsx      # Error display with retry
│   ├── PlantDropdown.jsx     # Plant selector with info card
│   ├── TraitCard.jsx         # Prediction result card + trait grid
│   └── HistoryTable.jsx      # Expandable history table
├── hooks/
│   └── usePlants.js          # Custom hook for fetching plant list
├── pages/
│   ├── HomePage.jsx          # Landing page with hero + features
│   ├── PredictPage.jsx       # Plant selection + predict trigger
│   ├── ResultPage.jsx        # Prediction result display
│   ├── HistoryPage.jsx       # Past predictions table
│   └── NotFoundPage.jsx      # 404 page
├── App.jsx                   # Router + layout wrapper
├── main.jsx                  # React entry point
└── index.css                 # Tailwind directives + global styles
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different port.

### 3. Start dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**

> The Vite dev server automatically proxies `/api/*` → `http://localhost:5000/*`
> so your backend and frontend don't conflict.

---

## Backend Integration

### Expected API Endpoints

| Method | Path       | Description                        |
|--------|------------|------------------------------------|
| GET    | /plants    | Returns array of plant objects     |
| POST   | /predict   | Accepts `{ plant1Id, plant2Id }`   |
| GET    | /history   | Returns prediction history array   |

### Plant Object Shape (GET /plants)

```json
[
  {
    "_id": "64abc123...",
    "name": "Tomato",
    "species": "Solanum lycopersicum",
    "emoji": "🍅",
    "origin": "South America"
  }
]
```

### Predict Request / Response (POST /predict)

**Request body:**
```json
{ "plant1Id": "64abc123", "plant2Id": "64def456" }
```

**Response:**
```json
{
  "prediction": {
    "height": "120–150 cm",
    "leafShape": "Ovate",
    "flowerColor": "Yellow",
    "climateAdaptability": "Tropical / Subtropical",
    "diseaseResistance": "High",
    "growthDuration": "75–90 days",
    "yield": "High"
  }
}
```

### History Object Shape (GET /history)

```json
[
  {
    "_id": "64ghi789...",
    "plant1": { "name": "Tomato" },
    "plant2": { "name": "Pepper" },
    "prediction": {
      "height": "90–120 cm",
      "flowerColor": "White",
      "yield": "Medium"
    },
    "createdAt": "2024-03-15T10:30:00.000Z"
  }
]
```

---

## Production Build

```bash
npm run build
# Output goes to /dist — deploy to any static host (Vercel, Netlify, etc.)
```

For production, set `VITE_API_BASE_URL` in `.env` to your backend URL:
```
VITE_API_BASE_URL=https://your-backend.com/api
```

---

## Changing the Backend URL

All API calls go through `src/api/plantApi.js`. To change the backend:

1. Update `VITE_API_BASE_URL` in `.env`
2. Or update the proxy target in `vite.config.js` for development

No other files need to be changed.
