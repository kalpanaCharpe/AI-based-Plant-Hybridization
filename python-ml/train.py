# train.py
# ─────────────────────────────────────────────────────────────────────────────
# Trains one ML model per predicted trait:
#   • height, growth_days          → RandomForestRegressor
#   • leaf_shape, flower_color,
#     climate, resistance,
#     yield_level                  → RandomForestClassifier
#
# Evaluation metrics are printed and saved to logs/training_report.json.
# All models + encoders are persisted to models/ via joblib.
# ─────────────────────────────────────────────────────────────────────────────

import os, sys, json, warnings
warnings.filterwarnings('ignore')

import numpy  as np
import pandas as pd
import joblib

# from sklearn.ensemble          import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
from sklearn.ensemble          import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection   import train_test_split, cross_val_score
from sklearn.preprocessing     import LabelEncoder
from sklearn.metrics           import (accuracy_score, classification_report,
                                       mean_absolute_error, r2_score)

# Ensure we can import sibling modules
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

from utils.generate_training_data import build_dataset, LEAF_SHAPES, FLOWER_COLORS, CLIMATES, RESISTANCES, YIELD_LEVELS

MODELS_DIR = os.path.join(BASE, 'models')
LOGS_DIR   = os.path.join(BASE, 'logs')
DATA_DIR   = os.path.join(BASE, 'data')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR,   exist_ok=True)

# ── Feature columns used for every model ────────────────────────────────────
FEATURE_COLS = [
    'p1_height', 'p2_height',
    'p1_growth_days', 'p2_growth_days',
    'p1_leaf_shape', 'p2_leaf_shape',
    'p1_flower_color', 'p2_flower_color',
    'p1_climate', 'p2_climate',
    'p1_resistance', 'p2_resistance',
    'p1_yield', 'p2_yield',
    'same_family',
]

# ── Target configuration ─────────────────────────────────────────────────────
TARGETS = {
    # name              : (column,               task,           classes or None)
    'height'       : ('target_height',       'regression',   None),
    'growth_days'  : ('target_growth_days',  'regression',   None),
    'leaf_shape'   : ('target_leaf_shape',   'classification', LEAF_SHAPES),
    'flower_color' : ('target_flower_color', 'classification', FLOWER_COLORS),
    'climate'      : ('target_climate',      'classification', CLIMATES),
    'resistance'   : ('target_resistance',   'classification', RESISTANCES),
    'yield_level'  : ('target_yield_level',  'classification', YIELD_LEVELS),
}


def train():
    # ── 1. Load or generate training data ────────────────────────────────────
    csv_path = os.path.join(DATA_DIR, 'training_data.csv')
    plants_path = os.path.join(DATA_DIR, 'plants.json')

    with open(plants_path) as f:
        plants = json.load(f)

    print(f"\n{'='*60}")
    print("  🌿  Hybrid Plant Prediction — ML Training Pipeline")
    print(f"{'='*60}\n")
    print(f"📊  Generating training data from {len(plants)} plant species…")

    df = build_dataset(plants, augment_factor=8)
    df.to_csv(csv_path, index=False)
    print(f"    Total samples: {len(df)}\n")

    X = df[FEATURE_COLS].values
    report = {}

    # ── 2. Train one model per target ─────────────────────────────────────────
    for trait, (col, task, classes) in TARGETS.items():
        print(f"─── Training: {trait.upper()} ({task}) ───")
        y_raw = df[col].values

        if task == 'classification':
            # LabelEncode string targets so sklearn can handle them
            le = LabelEncoder()
            # Fit on full known class list so unseen labels don't crash predict
            if classes:
                le.fit(classes)
            y = le.transform(y_raw)
        else:
            le = None
            y  = y_raw.astype(float)

        # Train / test split
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

        if task == 'regression':
            model = RandomForestRegressor(
                n_estimators=200,
                max_depth=12,
                min_samples_split=3,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_tr, y_tr)
            y_pred = model.predict(X_te)
            mae    = mean_absolute_error(y_te, y_pred)
            r2     = r2_score(y_te, y_pred)

            # Cross-validation
            cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2', n_jobs=-1)

            print(f"    MAE : {mae:.2f}")
            print(f"    R²  : {r2:.4f}")
            print(f"    CV R² (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
            report[trait] = {
                'task': task, 'mae': round(mae, 3),
                'r2': round(r2, 4), 'cv_r2_mean': round(cv_scores.mean(), 4)
            }

        else:  # classification
            model = RandomForestClassifier(
                n_estimators=200,
                max_depth=10,
                min_samples_split=3,
                min_samples_leaf=2,
                class_weight='balanced',
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_tr, y_tr)
            y_pred = model.predict(X_te)
            acc    = accuracy_score(y_te, y_pred)

            # Cross-validation
            cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=-1)

            print(f"    Accuracy : {acc:.4f}")
            print(f"    CV Acc (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
            report[trait] = {
                'task': task, 'accuracy': round(acc, 4),
                'cv_accuracy_mean': round(cv_scores.mean(), 4)
            }

        # ── 3. Save model + encoder ───────────────────────────────────────────
        model_path = os.path.join(MODELS_DIR, f'{trait}_model.pkl')
        joblib.dump(model, model_path)
        print(f"    ✅  Saved → {model_path}")

        if le is not None:
            enc_path = os.path.join(MODELS_DIR, f'{trait}_encoder.pkl')
            joblib.dump(le, enc_path)

        print()

    # ── 4. Save feature column list (used by predictor at inference time) ─────
    meta = {
        'feature_cols': FEATURE_COLS,
        'targets': {k: {'col': v[0], 'task': v[1]} for k, v in TARGETS.items()},
        'encodings': {
            'leaf_shape':    LEAF_SHAPES,
            'flower_color':  FLOWER_COLORS,
            'climate':       CLIMATES,
            'resistance':    RESISTANCES,
            'yield_level':   YIELD_LEVELS,
        }
    }
    joblib.dump(meta, os.path.join(MODELS_DIR, 'metadata.pkl'))

    # ── 5. Save training report ────────────────────────────────────────────────
    report_path = os.path.join(LOGS_DIR, 'training_report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"{'='*60}")
    print("  🎉  Training complete!")
    print(f"  📁  Models saved to  : {MODELS_DIR}")
    print(f"  📋  Report saved to  : {report_path}")
    print(f"{'='*60}\n")

    return report


if __name__ == '__main__':
    train()
