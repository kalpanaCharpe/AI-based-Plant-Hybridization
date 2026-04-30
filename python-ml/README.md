# 🌿 Hybrid Plant ML Service

Flask-based Python ML pipeline for the Hybrid Plant Prediction System.
Trains 7 Random Forest models — one per predicted trait — and serves predictions via REST API.

---

## Architecture

```
hybrid-plant-ml/
├── app.py                        ← Flask REST API (serves predictions)
├── train.py                      ← Training pipeline (trains all 7 models)
├── predict.py                    ← HybridPredictor class (inference)
├── evaluate.py                   ← Detailed evaluation + feature importance
├── requirements.txt
├── data/
│   ├── plants.json               ← Source plant dataset (35 species)
│   └── training_data.csv         ← Generated after training
├── models/                       ← Saved .pkl files (created after training)
│   ├── height_model.pkl
│   ├── leaf_shape_model.pkl
│   ├── flower_color_model.pkl
│   ├── climate_model.pkl
│   ├── resistance_model.pkl
│   ├── growth_days_model.pkl
│   ├── yield_level_model.pkl
│   ├── *_encoder.pkl             ← LabelEncoders for categorical traits
│   └── metadata.pkl              ← Feature names + encoding maps
├── logs/
│   ├── training_report.json      ← Metrics from last train run
│   └── evaluation_report.json    ← Detailed eval from evaluate.py
└── utils/
    └── generate_training_data.py ← Synthetic hybrid sample generator
```

---

## ML Pipeline Explained

### How training data is generated

Since real hybrid plant datasets are not publicly available at scale, training data
is **synthesised** from the 35 parent plants using biological inheritance rules:

- **Numeric traits** (height, growth_days): average of both parents + small Gaussian noise
- **Categorical traits** (leaf_shape, flower_color, climate): same value if parents match,
  otherwise randomly pick one parent's value or 'Intermediate'
- **Resistance**: hybrid inherits the higher resistance (heterosis effect)
- **Yield**: hybrid yield is average-rounded-up (vigour heterosis)

With 35 plants × 34 pairs × 8 augmentations × 2 directions = **~9,520 training samples**.

### Models

| Trait | Model Type | Metric |
|---|---|---|
| height | RandomForestRegressor | R², MAE |
| growth_days | RandomForestRegressor | R², MAE |
| leaf_shape | RandomForestClassifier | Accuracy |
| flower_color | RandomForestClassifier | Accuracy |
| climate | RandomForestClassifier | Accuracy |
| resistance | RandomForestClassifier | Accuracy |
| yield_level | RandomForestClassifier | Accuracy |

### Features used (15 total)

Each model receives the same 15-feature vector:

```
p1_height, p2_height,
p1_growth_days, p2_growth_days,
p1_leaf_shape (encoded), p2_leaf_shape (encoded),
p1_flower_color (encoded), p2_flower_color (encoded),
p1_climate (encoded), p2_climate (encoded),
p1_resistance (rank), p2_resistance (rank),
p1_yield (rank), p2_yield (rank),
same_family (0/1)
```

---

## Quick Start

### 1. Install dependencies

```bash
cd hybrid-plant-ml
pip install -r requirements.txt
```

### 2. Train the models

```bash
python train.py
```

Expected output:
```
=============================================================
  🌿  Hybrid Plant Prediction — ML Training Pipeline
=============================================================
📊  Generating training data from 35 plant species…
    Total samples: 9520

─── Training: HEIGHT (regression) ───
    MAE : 4.23
    R²  : 0.9871
    CV R² (5-fold): 0.9843 ± 0.0032

─── Training: LEAF_SHAPE (classification) ───
    Accuracy : 0.9654
    CV Acc (5-fold): 0.9612 ± 0.0041
...
```

### 3. Evaluate models (optional)

```bash
python evaluate.py
```

Prints detailed classification reports, confusion matrices, and feature importance rankings.

### 4. Start the Flask API

```bash
python app.py
```

API starts at `http://localhost:8000`

---

## API Endpoints

### POST /predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "plantA": {
      "name": "Petunia axillaris",
      "height_cm": 35, "leaf_shape": "Ovate", "flower_color": "White",
      "climate": "Temperate", "resistance": "Moderate",
      "growth_days": 80, "yield_level": "Moderate", "family": "Solanaceae"
    },
    "plantB": {
      "name": "Petunia integrifolia",
      "height_cm": 45, "leaf_shape": "Ovate", "flower_color": "Purple",
      "climate": "Temperate", "resistance": "High",
      "growth_days": 95, "yield_level": "High", "family": "Solanaceae"
    }
  }'
```

Response:
```json
{
  "success": true,
  "predicted_hybrid": "Petunia × hybrid",
  "traits": {
    "height": 40.2,
    "leaf_shape": "Ovate",
    "flower_color": "Intermediate",
    "climate": "Temperate",
    "resistance": "High",
    "growth_days": 87.5,
    "yield_level": "High"
  },
  "confidence": {
    "height": 0.94,
    "leaf_shape": 0.97,
    "flower_color": 0.81,
    "climate": 0.99,
    "resistance": 0.88,
    "growth_days": 0.96,
    "yield_level": 0.85
  },
  "overall_confidence": 0.914,
  "source": "ml_model",
  "model_type": "RandomForest"
}
```

### POST /train

Triggers background retraining. Returns 202 immediately. Poll `/health` to check progress.

```bash
curl -X POST http://localhost:8000/train
```

### GET /health

```bash
curl http://localhost:8000/health
```

### GET /report

Returns last training metrics.

```bash
curl http://localhost:8000/report
```

---

## Running all three services together

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Node.js backend
cd hybrid-plant-backend
npm run dev

# Terminal 3 — Flask ML API
cd hybrid-plant-ml
python train.py      # first time only
python app.py

# Terminal 4 — React frontend
cd hybrid-plant-app
npm run dev
```

Open http://localhost:3000 — predictions now come from the ML model.
The Node.js backend automatically falls back to rule-based if Flask is offline.

---

## Retraining with new data

To add more plants:
1. Add entries to `data/plants.json`
2. Run `python train.py` — models retrain automatically
3. Or send `POST http://localhost:8000/train` — retrains without restarting the server
