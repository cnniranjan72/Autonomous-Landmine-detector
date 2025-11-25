import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib
import os
import warnings
warnings.filterwarnings("ignore")

# ======================================================
# 1. LOAD ORIGINAL DATA
# ======================================================

INPUT_FILE = "mine_dataset.csv"

df = pd.read_csv(INPUT_FILE)

print("\n=== Loaded Dataset ===")
print(df.head())
print("Shape:", df.shape)

# ======================================================
# 2. BASIC CLEANING
# ======================================================

df.columns = ["V", "H", "S", "M"]
df.dropna(inplace=True)

# Ensure numeric
df = df.astype(float)

# ======================================================
# 3. SYNTHETIC DATA AUGMENTATION
# ======================================================

def augment_data(data, multiplier=3):
    augmented = []

    for _ in range(multiplier):
        noise = np.random.normal(0, 0.01, data.shape)
        noisy_data = data.copy()
        noisy_data["V"] += noise[:, 0]
        noisy_data["H"] += noise[:, 1]
        noisy_data["S"] += np.round(noise[:, 2])
        noisy_data["M"] += 0  # labels unchanged
        augmented.append(noisy_data)

    return pd.concat(augmented, axis=0)

augmented_df = augment_data(df, multiplier=4)

full_df = pd.concat([df, augmented_df], axis=0).reset_index(drop=True)

# Clip soil type between 1–6
full_df["S"] = full_df["S"].clip(lower=1, upper=6)
full_df["M"] = full_df["M"].clip(lower=1, upper=5)

print("\n=== After Augmentation ===")
print(full_df.shape)

# ======================================================
# 4. SAVE PROCESSED DATASET
# ======================================================

full_df.to_csv("processed_dataset.csv", index=False)
print("Saved processed dataset → processed_dataset.csv")

# ======================================================
# 5. TRAIN/TEST SPLIT
# ======================================================

X = full_df[["V", "H", "S"]]
y = full_df["M"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ======================================================
# 6. SCALING
# ======================================================

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

joblib.dump(scaler, "scaler.pkl")
print("Saved scaler.pkl")

# ======================================================
# 7. RANDOM FOREST MODEL
# ======================================================

rf = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42)
rf.fit(X_train_scaled, y_train)
pred_rf = rf.predict(X_test_scaled)

print("\n=== RANDOM FOREST RESULTS ===")
print("Accuracy:", accuracy_score(y_test, pred_rf))
print(classification_report(y_test, pred_rf))

joblib.dump(rf, "rf_tabular_model.pkl")
print("Saved rf_tabular_model.pkl")

# ======================================================
# 8. XGBOOST MODEL
# ======================================================

# Shift labels: XGBoost requires 0-based class indices
y_train_xgb = y_train - 1
y_test_xgb = y_test - 1

xgb = XGBClassifier(
    objective="multi:softmax",
    num_class=5,
    eval_metric="mlogloss",
    learning_rate=0.1,
    max_depth=6,
    n_estimators=300,
    random_state=42
)

xgb.fit(X_train_scaled, y_train_xgb)

pred_xgb = xgb.predict(X_test_scaled)
pred_xgb = pred_xgb + 1   # shift back to original labels 1–5

print("\n=== XGBOOST RESULTS ===")
print("Accuracy:", accuracy_score(y_test, pred_xgb))
print(classification_report(y_test, pred_xgb))

joblib.dump(xgb, "xgb_tabular_model.pkl")
print("Saved xgb_tabular_model.pkl")


# ======================================================
# 9. DONE
# ======================================================

print("\nTraining complete. Models + dataset saved successfully!")
