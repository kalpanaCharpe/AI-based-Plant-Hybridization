# predict.py
# ─────────────────────────────────────────────────────────────────────────────
# Loads trained joblib models and runs inference for a given plant pair.
# Used by app.py at request time.
# ─────────────────────────────────────────────────────────────────────────────

import os, joblib
import numpy as np

BASE       = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE, 'models')


class HybridPredictor:
    """
    Loads all trained models once at startup and exposes a single
    predict(plantA, plantB) method.
    """

    def __init__(self):
        self._loaded  = False
        self.models   = {}
        self.encoders = {}
        self.meta     = {}

    def load(self):
        """Load all .pkl files from the models/ directory."""
        meta_path = os.path.join(MODELS_DIR, 'metadata.pkl')
        if not os.path.exists(meta_path):
            raise FileNotFoundError(
                "No trained models found. Run  python train.py  first."
            )

        self.meta     = joblib.load(meta_path)
        trait_names   = list(self.meta['targets'].keys())

        for trait in trait_names:
            model_path = os.path.join(MODELS_DIR, f'{trait}_model.pkl')
            enc_path   = os.path.join(MODELS_DIR, f'{trait}_encoder.pkl')

            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Missing model file: {model_path}")

            self.models[trait] = joblib.load(model_path)
            if os.path.exists(enc_path):
                self.encoders[trait] = joblib.load(enc_path)

        self._loaded = True
        print(f"✅  HybridPredictor loaded {len(self.models)} models")

    # ── Feature engineering (mirrors generate_training_data.py) ──────────────

    def _encode_cat(self, value, options):
        """Encode a categorical string to its integer index."""
        try:
            return options.index(value)
        except ValueError:
            # Unknown value — return middle index as safe fallback
            return len(options) // 2

    def _resistance_rank(self, r):
        return self.meta['encodings']['resistance'].index(r) \
               if r in self.meta['encodings']['resistance'] else 1

    def _yield_rank(self, y):
        return self.meta['encodings']['yield_level'].index(y) \
               if y in self.meta['encodings']['yield_level'] else 1

    def _build_feature_vector(self, pA: dict, pB: dict) -> np.ndarray:
        enc = self.meta['encodings']
        features = [
            pA.get('height_cm', 100),
            pB.get('height_cm', 100),
            pA.get('growth_days', 90),
            pB.get('growth_days', 90),
            self._encode_cat(pA.get('leaf_shape',   'Ovate'),    enc['leaf_shape']),
            self._encode_cat(pB.get('leaf_shape',   'Ovate'),    enc['leaf_shape']),
            self._encode_cat(pA.get('flower_color', 'White'),    enc['flower_color']),
            self._encode_cat(pB.get('flower_color', 'White'),    enc['flower_color']),
            self._encode_cat(pA.get('climate',      'Temperate'), enc['climate']),
            self._encode_cat(pB.get('climate',      'Temperate'), enc['climate']),
            self._resistance_rank(pA.get('resistance', 'Moderate')),
            self._resistance_rank(pB.get('resistance', 'Moderate')),
            self._yield_rank(pA.get('yield_level', 'Moderate')),
            self._yield_rank(pB.get('yield_level', 'Moderate')),
            1 if pA.get('family') == pB.get('family') else 0,
        ]
        return np.array(features, dtype=float).reshape(1, -1)

    # ── Confidence calculation ────────────────────────────────────────────────

    def _get_confidence(self, model, X, task):
        """
        For classifiers: return max class probability.
        For regressors:  use variance across trees as a proxy (inverted).
        """
        try:
            if task == 'classification':
                proba = model.predict_proba(X)[0]
                return round(float(proba.max()), 3)
            else:
                # Collect individual tree predictions
                preds = np.array([t.predict(X)[0] for t in model.estimators_])
                std   = preds.std()
                mean  = abs(preds.mean()) + 1e-9
                cv    = std / mean   # coefficient of variation
                conf  = max(0.5, min(0.99, 1.0 - cv))
                return round(float(conf), 3)
        except Exception:
            return 0.75

    # ── Main prediction method ────────────────────────────────────────────────

    def predict(self, plantA: dict, plantB: dict) -> dict:
        """
        Run inference for a plant pair.
        Returns the 7 predicted traits + confidence scores.
        """
        if not self._loaded:
            self.load()

        X = self._build_feature_vector(plantA, plantB)
        enc = self.meta['encodings']
        results = {}
        confidences = {}

        for trait, info in self.meta['targets'].items():
            task  = info['task']
            model = self.models[trait]

            raw_pred = model.predict(X)[0]
            conf     = self._get_confidence(model, X, task)

            if task == 'regression':
                value = round(float(raw_pred), 1)
            else:
                # Decode integer back to string label
                le = self.encoders.get(trait)
                if le is not None:
                    value = le.inverse_transform([int(round(raw_pred))])[0]
                else:
                    value = str(raw_pred)

            results[trait]     = value
            confidences[trait] = conf

        # Overall confidence = mean of all individual confidences
        overall_conf = round(sum(confidences.values()) / len(confidences), 3)

        return {
            'traits':      results,
            'confidence':  confidences,
            'overall_confidence': overall_conf,
        }


# Singleton — loaded once when the module is imported
predictor = HybridPredictor()
