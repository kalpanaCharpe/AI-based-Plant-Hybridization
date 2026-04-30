# utils/generate_training_data.py
# Generates synthetic hybrid training samples from the plant dataset.
# For each pair of plants, a "hybrid" is computed using biological inheritance rules,
# then small random noise is added to simulate real-world genetic variation.
# This gives the ML models diverse training examples to learn from.

import json
import random
import itertools
import pandas as pd
import numpy as np
import os

# ── Encoding maps (must match the ones used in training) ─────────────────────
LEAF_SHAPES    = ['Ovate','Lanceolate','Elliptical','Linear','Palmate','Cordate',
                  'Oblong','Pinnate','Spatulate','Compound','Lobed','Intermediate','Needle-like']
FLOWER_COLORS  = ['White','Yellow','Purple','Pink','Red','Orange','Blue','Intermediate']
CLIMATES       = ['Tropical','Subtropical','Temperate','Mediterranean','Arid',
                  'Semi-Arid','Cool Temperate','Moderate','Tropical/Subtropical','Tropical/Temperate']
RESISTANCES    = ['Low','Moderate','High','Very High']
YIELD_LEVELS   = ['Low','Moderate','Medium','High','Very High']

RESISTANCE_RANK = {r: i for i, r in enumerate(RESISTANCES)}
YIELD_RANK      = {y: i for i, y in enumerate(YIELD_LEVELS)}


def _blend_categorical(a, b, options):
    """Return parent value if same, else pick intermediate or one of the parents."""
    if a == b:
        return a
    # 50% chance intermediate if supported, else pick dominant parent
    if 'Intermediate' in options:
        return random.choice([a, b, 'Intermediate', 'Intermediate'])
    return random.choice([a, b])


def _blend_numeric(a, b, noise_pct=0.05):
    """Average of two numerics + small Gaussian noise (±5%)."""
    mid = (a + b) / 2.0
    noise = mid * noise_pct * np.random.randn()
    return max(1, round(mid + noise, 1))


def _blend_resistance(a, b):
    ra, rb = RESISTANCE_RANK.get(a, 1), RESISTANCE_RANK.get(b, 1)
    # Heterosis: hybrid can exceed lower parent
    hybrid_rank = min(max(ra, rb) + (1 if ra != rb else 0), len(RESISTANCES) - 1)
    return RESISTANCES[hybrid_rank]


def _blend_yield(a, b):
    ya, yb = YIELD_RANK.get(a, 1), YIELD_RANK.get(b, 1)
    hybrid_rank = min(int((ya + yb) / 2) + (1 if ya != yb else 0), len(YIELD_LEVELS) - 1)
    return YIELD_LEVELS[hybrid_rank]


def generate_hybrid(p1: dict, p2: dict) -> dict:
    """Create one synthetic hybrid record from two parent plants."""
    return {
        # ── Parent numeric features (raw) ────────────────────────────────────
        'p1_height':      p1['height_cm'],
        'p2_height':      p2['height_cm'],
        'p1_growth_days': p1['growth_days'],
        'p2_growth_days': p2['growth_days'],
        # ── Parent categorical features (encoded as int) ──────────────────────
        'p1_leaf_shape':   LEAF_SHAPES.index(p1['leaf_shape'])   if p1['leaf_shape']  in LEAF_SHAPES  else 0,
        'p2_leaf_shape':   LEAF_SHAPES.index(p2['leaf_shape'])   if p2['leaf_shape']  in LEAF_SHAPES  else 0,
        'p1_flower_color': FLOWER_COLORS.index(p1['flower_color']) if p1['flower_color'] in FLOWER_COLORS else 0,
        'p2_flower_color': FLOWER_COLORS.index(p2['flower_color']) if p2['flower_color'] in FLOWER_COLORS else 0,
        'p1_climate':      CLIMATES.index(p1['climate'])         if p1['climate']     in CLIMATES     else 0,
        'p2_climate':      CLIMATES.index(p2['climate'])         if p2['climate']     in CLIMATES     else 0,
        'p1_resistance':   RESISTANCE_RANK.get(p1['resistance'], 1),
        'p2_resistance':   RESISTANCE_RANK.get(p2['resistance'], 1),
        'p1_yield':        YIELD_RANK.get(p1['yield_level'], 1),
        'p2_yield':        YIELD_RANK.get(p2['yield_level'], 1),
        # ── Same family flag ──────────────────────────────────────────────────
        'same_family':     1 if p1.get('family') == p2.get('family') else 0,
        # ── Target variables (what the models will predict) ───────────────────
        'target_height':       _blend_numeric(p1['height_cm'],  p2['height_cm']),
        'target_growth_days':  _blend_numeric(p1['growth_days'], p2['growth_days']),
        'target_leaf_shape':   _blend_categorical(p1['leaf_shape'],   p2['leaf_shape'],   LEAF_SHAPES),
        'target_flower_color': _blend_categorical(p1['flower_color'], p2['flower_color'], FLOWER_COLORS),
        'target_climate':      _blend_categorical(p1['climate'],      p2['climate'],      CLIMATES),
        'target_resistance':   _blend_resistance(p1['resistance'], p2['resistance']),
        'target_yield_level':  _blend_yield(p1['yield_level'], p2['yield_level']),
    }


def build_dataset(plants: list, augment_factor: int = 4) -> pd.DataFrame:
    """
    Build training DataFrame from all unique plant pairs.
    augment_factor: how many noisy variants to generate per pair.
    """
    records = []
    pairs   = list(itertools.combinations(plants, 2))

    for p1, p2 in pairs:
        for _ in range(augment_factor):
            records.append(generate_hybrid(p1, p2))
            # Also generate the reverse pair (order matters for some models)
            records.append(generate_hybrid(p2, p1))

    df = pd.DataFrame(records)
    print(f"✅  Training dataset: {len(df)} samples from {len(pairs)} unique plant pairs")
    return df


if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(base, 'data', 'plants.json')) as f:
        plants = json.load(f)

    df = build_dataset(plants, augment_factor=6)
    out = os.path.join(base, 'data', 'training_data.csv')
    df.to_csv(out, index=False)
    print(f"📄  Saved to {out}")
    print(df.describe())
