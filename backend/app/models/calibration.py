# backend/app/models/calibration.py
"""
Train a RandomForest baseline + IsotonicRegression calibration model
using the uploaded dataset at /mnt/data/mine_detection_dataset.csv.

Outputs (saved in backend/app/models/):
 - calibration_model.pkl      (IsotonicRegression)
 - rf_baseline.pkl            (RandomForestClassifier baseline)
 - calibration_metadata.json  (metrics + simple summary)
"""

import os
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import brier_score_loss, roc_auc_score, log_loss
from sklearn.calibration import calibration_curve
import joblib

# === CONFIG ===
DATA_PATH = "mine_detection_dataset.csv"   # uploaded dataset
OUT_DIR = Path(__file__).resolve().parent  # backend/app/models
OUT_DIR.mkdir(parents=True, exist_ok=True)

RF_PATH = OUT_DIR / "rf_baseline.pkl"
CALIB_PATH = OUT_DIR / "calibration_model.pkl"
META_PATH = OUT_DIR / "calibration_metadata.json"

RANDOM_STATE = 42
TEST_SIZE = 0.25

# === LOAD ===
print("Loading dataset:", DATA_PATH)
df = pd.read_csv(DATA_PATH)
print("Columns:", df.columns.tolist())
# Try to guess label column: prefer 'Mine_Present' or 'mine_present' or 'M' or last column
possible_labels = ["Mine_Present", "mine_present", "MinePresent", "M", "mine", "label"]
label_col = None
for name in possible_labels:
    if name in df.columns:
        label_col = name
        break
# fallback to last column
if label_col is None:
    label_col = df.columns[-1]

print("Using label column:", label_col)

# features = everything except label
X = df.drop(columns=[label_col])
y = df[label_col].astype(int)  # ensure integer 0/1

# basic checks
unique_labels = sorted(y.unique().tolist())
print("Unique labels in target:", unique_labels)
if not set(unique_labels).issubset({0, 1}):
    print("WARNING: labels are not binary 0/1. Attempting to map values >0 to 1.")
    y = (y > 0).astype(int)

# split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)

print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

# === TRAIN BASELINE RANDOM FOREST ===
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    random_state=RANDOM_STATE,
    n_jobs=-1
)
print("Training RandomForest baseline...")
rf.fit(X_train, y_train)
joblib.dump(rf, RF_PATH)
print("Saved RF baseline to:", RF_PATH)

# === RAW PROBABILITIES ON HOLDOUT ===
print("Predicting raw probabilities on holdout...")
raw_probs = rf.predict_proba(X_test)[:, 1]  # probability for class 1
raw_preds = rf.predict(X_test)

# basic raw metrics
brier_raw = float(brier_score_loss(y_test, raw_probs))
auc_raw = float(roc_auc_score(y_test, raw_probs)) if len(np.unique(y_test)) > 1 else None
logloss_raw = float(log_loss(y_test, raw_probs)) if len(np.unique(y_test)) > 1 else None
print("Raw Brier:", brier_raw, "AUC:", auc_raw)

# === FIT ISOTONIC REGRESSION ON raw_probs -> y_test ===
print("Fitting Isotonic Regression for calibration...")
iso = IsotonicRegression(out_of_bounds="clip")
# Isotonic expects 1D arrays of shape (n_samples,)
iso.fit(raw_probs, y_test)
joblib.dump(iso, CALIB_PATH)
print("Saved calibration model to:", CALIB_PATH)

# calibrated probs
cal_probs = iso.predict(raw_probs)

# calibrated metrics
brier_cal = float(brier_score_loss(y_test, cal_probs))
auc_cal = float(roc_auc_score(y_test, cal_probs)) if len(np.unique(y_test)) > 1 else None
logloss_cal = float(log_loss(y_test, cal_probs)) if len(np.unique(y_test)) > 1 else None
print("Calibrated Brier:", brier_cal, "AUC:", auc_cal)

# calibration curve (reliability diagram buckets)
fraction_of_pos, mean_predicted_value = calibration_curve(y_test, cal_probs, n_bins=10)

meta = {
    "dataset": str(DATA_PATH),
    "n_samples": int(len(df)),
    "train_samples": int(len(X_train)),
    "test_samples": int(len(X_test)),
    "rf": {
        "n_estimators": rf.n_estimators,
        "max_depth": rf.max_depth
    },
    "metrics": {
        "raw": {
            "brier": brier_raw,
            "auc": auc_raw,
            "logloss": logloss_raw
        },
        "calibrated": {
            "brier": brier_cal,
            "auc": auc_cal,
            "logloss": logloss_cal
        },
        "improvement": {
            "brier_delta": brier_raw - brier_cal
        }
    },
    "reliability_curve": {
        "fraction_of_pos": fraction_of_pos.tolist(),
        "mean_predicted_value": mean_predicted_value.tolist()
    }
}

with open(META_PATH, "w") as f:
    json.dump(meta, f, indent=2)

print("Saved calibration metadata to:", META_PATH)
print("Done. You can now copy calibration_model.pkl into your backend models folder (it was saved there).")
