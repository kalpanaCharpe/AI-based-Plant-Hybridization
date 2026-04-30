# evaluate.py
# ─────────────────────────────────────────────────────────────────────────────
# Standalone evaluation script.
# Prints detailed metrics, feature importance, and per-class accuracy.
# Run:  python evaluate.py
# ─────────────────────────────────────────────────────────────────────────────

import os, sys, json, warnings
warnings.filterwarnings('ignore')

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

import numpy   as np
import pandas  as pd
import joblib

from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
from sklearn.metrics         import (classification_report, confusion_matrix,
                                     mean_absolute_error, r2_score)
from utils.generate_training_data import build_dataset, LEAF_SHAPES, FLOWER_COLORS, CLIMATES, RESISTANCES, YIELD_LEVELS

MODELS_DIR = os.path.join(BASE, 'models')
LOGS_DIR   = os.path.join(BASE, 'logs')

FEATURE_COLS = [
    'p1_height', 'p2_height', 'p1_growth_days', 'p2_growth_days',
    'p1_leaf_shape', 'p2_leaf_shape', 'p1_flower_color', 'p2_flower_color',
    'p1_climate', 'p2_climate', 'p1_resistance', 'p2_resistance',
    'p1_yield', 'p2_yield', 'same_family',
]

FEATURE_NAMES = [
    'Parent A Height', 'Parent B Height',
    'Parent A Growth Days', 'Parent B Growth Days',
    'Parent A Leaf Shape', 'Parent B Leaf Shape',
    'Parent A Flower Color', 'Parent B Flower Color',
    'Parent A Climate', 'Parent B Climate',
    'Parent A Resistance', 'Parent B Resistance',
    'Parent A Yield', 'Parent B Yield',
    'Same Family',
]


def evaluate():
    meta_path = os.path.join(MODELS_DIR, 'metadata.pkl')
    if not os.path.exists(meta_path):
        print("❌  No trained models found. Run  python train.py  first.")
        return

    meta   = joblib.load(meta_path)
    plants_path = os.path.join(BASE, 'data', 'plants.json')

    with open(plants_path) as f:
        plants = json.load(f)

    print(f"\n{'='*65}")
    print("  📊  Hybrid Plant Prediction — Model Evaluation Report")
    print(f"{'='*65}\n")

    df = build_dataset(plants, augment_factor=8)
    X  = df[FEATURE_COLS].values
    full_report = {}

    for trait, info in meta['targets'].items():
        task = info['task']
        col  = info['col']
        print(f"\n{'─'*50}")
        print(f"  Trait: {trait.upper()}  ({task})")
        print(f"{'─'*50}")

        model_path = os.path.join(MODELS_DIR, f'{trait}_model.pkl')
        model = joblib.load(model_path)
        y_raw = df[col].values

        if task == 'classification':
            enc_path = os.path.join(MODELS_DIR, f'{trait}_encoder.pkl')
            le = joblib.load(enc_path)
            y  = le.transform(y_raw)

            # Cross-validation
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy', n_jobs=-1)
            print(f"  Cross-val Accuracy : {scores.mean():.4f} ± {scores.std():.4f}")

            # Hold-out predictions
            from sklearn.model_selection import train_test_split
            X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
            model.fit(X_tr, y_tr)
            y_pred = model.predict(X_te)
            print(f"  Hold-out Accuracy  : {(y_pred == y_te).mean():.4f}")

            labels = list(range(len(le.classes_)))
            print(f"\n  Classification Report:")
            print(classification_report(y_te, y_pred,
                                        target_names=le.classes_,
                                        labels=labels,
                                        zero_division=0))
            full_report[trait] = {
                'task': task,
                'cv_accuracy': round(scores.mean(), 4),
                'cv_std': round(scores.std(), 4),
            }

        else:  # regression
            cv = KFold(n_splits=5, shuffle=True, random_state=42)
            y  = y_raw.astype(float)
            r2_scores  = cross_val_score(model, X, y, cv=cv, scoring='r2',         n_jobs=-1)
            mae_scores = cross_val_score(model, X, y, cv=cv, scoring='neg_mean_absolute_error', n_jobs=-1)

            print(f"  CV R²  : {r2_scores.mean():.4f} ± {r2_scores.std():.4f}")
            print(f"  CV MAE : {(-mae_scores).mean():.3f} ± {(-mae_scores).std():.3f}")
            full_report[trait] = {
                'task': task,
                'cv_r2': round(r2_scores.mean(), 4),
                'cv_mae': round((-mae_scores).mean(), 3),
            }

        # Feature importance (available for all Random Forest models)
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            top_idx     = np.argsort(importances)[::-1][:5]
            print(f"\n  Top 5 Important Features:")
            for rank, i in enumerate(top_idx, 1):
                name = FEATURE_NAMES[i] if i < len(FEATURE_NAMES) else f'feature_{i}'
                print(f"    {rank}. {name:<30} {importances[i]:.4f}")

    # Save full report
    os.makedirs(LOGS_DIR, exist_ok=True)
    report_path = os.path.join(LOGS_DIR, 'evaluation_report.json')
    with open(report_path, 'w') as f:
        json.dump(full_report, f, indent=2)

    print(f"\n{'='*65}")
    print(f"  ✅  Evaluation complete. Report saved to {report_path}")
    print(f"{'='*65}\n")


if __name__ == '__main__':
    evaluate()
