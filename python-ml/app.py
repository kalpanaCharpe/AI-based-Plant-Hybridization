import os, sys, json, threading, traceback
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

from flask      import Flask, request, jsonify
from flask_cors import CORS

from predict import predictor
import train as trainer

app = Flask(__name__)
CORS(app, origins='*')  # Node.js backend is on a different port

# Track training state
_training_status = {'running': False, 'last_trained': None, 'error': None}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _models_exist():
    return os.path.exists(os.path.join(BASE, 'models', 'metadata.pkl'))


def _load_report():
    path = os.path.join(BASE, 'logs', 'training_report.json')
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def success(data, status=200):
    return jsonify({'success': True,  **data}), status


def error(message, status=400, code=None):
    return jsonify({'success': False, 'error': message, 'code': code}), status


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def index():
    return success({
        'service': 'Hybrid Plant ML API',
        'version': '1.0.0',
        'models_ready': _models_exist(),
        'endpoints': {
            'predict':      'POST /predict',
            'train':        'POST /train',
            'health':       'GET  /health',
            'report':       'GET  /report',
        }
    })


@app.route('/health', methods=['GET'])
def health():
    loaded  = predictor._loaded
    trained = _models_exist()
    return success({
        'status':         'ok' if trained else 'untrained',
        'models_loaded':  loaded,
        'models_trained': trained,
        'training_running': _training_status['running'],
        'last_trained':   _training_status['last_trained'],
        'timestamp':      datetime.utcnow().isoformat(),
    })


@app.route('/train', methods=['POST'])
def train_models():
    """
    Trigger model training. Runs in a background thread so the HTTP response
    returns immediately. Poll GET /health to know when it finishes.
    """
    if _training_status['running']:
        return error('Training already in progress. Poll GET /health for status.', 409)

    def _run_training():
        _training_status['running'] = True
        _training_status['error']   = None
        try:
            report = trainer.train()
            _training_status['last_trained'] = datetime.utcnow().isoformat()
            # Reload the predictor with fresh models
            predictor._loaded = False
            predictor.load()
            print(f"✅  Training finished. Models reloaded.")
        except Exception as e:
            _training_status['error'] = str(e)
            traceback.print_exc()
        finally:
            _training_status['running'] = False

    thread = threading.Thread(target=_run_training, daemon=True)
    thread.start()

    return success({
        'message': 'Training started in background. Poll GET /health for status.',
        'started_at': datetime.utcnow().isoformat(),
    }, 202)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict hybrid traits for two parent plants.

    Expected JSON body:
    {
      "plantA": { "name": "...", "height_cm": 35, "leaf_shape": "Ovate", ... },
      "plantB": { "name": "...", "height_cm": 45, "leaf_shape": "Ovate", ... }
    }
    """
    if not _models_exist():
        return error(
            'Models not trained yet. Send POST /train first.',
            503, 'MODELS_NOT_TRAINED'
        )

    body = request.get_json(silent=True)
    if not body:
        return error('Request body must be JSON', 400, 'INVALID_JSON')

    plantA = body.get('plantA') or body.get('plant_a') or body.get('plant1')
    plantB = body.get('plantB') or body.get('plant_b') or body.get('plant2')

    if not plantA or not plantB:
        return error(
            'Request must include plantA and plantB objects',
            400, 'MISSING_PLANTS'
        )

    if not isinstance(plantA, dict) or not isinstance(plantB, dict):
        return error('plantA and plantB must be objects', 400, 'INVALID_TYPE')

    try:
        # Load models if not already loaded
        if not predictor._loaded:
            predictor.load()

        result = predictor.predict(plantA, plantB)

        # Build response in the shape Node.js backend expects
        return success({
            'predicted_hybrid': _derive_hybrid_name(
                plantA.get('name', plantA.get('plant_name', 'Plant A')),
                plantB.get('name', plantB.get('plant_name', 'Plant B'))
            ),
            'traits':     result['traits'],
            'confidence': result['confidence'],
            'overall_confidence': result['overall_confidence'],
            'source':     'ml_model',
            'model_type': 'RandomForest',
        })

    except FileNotFoundError as e:
        return error(str(e), 503, 'MODELS_NOT_FOUND')
    except Exception as e:
        traceback.print_exc()
        return error(f'Prediction failed: {str(e)}', 500, 'PREDICTION_ERROR')
        

@app.route('/report', methods=['GET'])
def report():
    """Return the last training metrics report."""
    data = _load_report()
    if not data:
        return error('No training report found. Run training first.', 404, 'REPORT_NOT_FOUND')
    return success({'report': data, 'generated_at': _training_status.get('last_trained')})


# ── Helpers ──────────────────────────────────────────────────────────────────

def _derive_hybrid_name(name_a: str, name_b: str) -> str:
    parts_a = name_a.split()
    parts_b = name_b.split()
    if parts_a and parts_b and parts_a[0] == parts_b[0]:
        return f"{parts_a[0]} × hybrid"
    return f"{name_a} × {name_b} hybrid"


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"\n🌿  Hybrid Plant ML API starting on port {port}")

    # Auto-load models if they exist
    if _models_exist():
        print("📦  Pre-trained models found — loading…")
        try:
            predictor.load()
        except Exception as e:
            print(f"⚠️  Could not load models: {e}")
    else:
        print("⚠️  No trained models found.")
        print("    Send  POST /train  to train the models first.")
        print("    The Node.js backend will use rule-based fallback until then.\n")

    app.run(host='0.0.0.0', port=port, debug=False)