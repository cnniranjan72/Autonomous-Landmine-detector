# app/app.py

from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# -----------------------------
# 1️⃣ Load classifier and PCA
# -----------------------------
MODEL_PATH = "../models/logreg_pca_radar_model.pkl"  # or randomforest / MineClassifier
PCA_PATH = "../models/pca_transform.pkl"             # optional, if PCA used

# Load classifier
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Classifier model not found at {MODEL_PATH}")
clf = joblib.load(MODEL_PATH)
print("✅ Classifier loaded")

# Load PCA if available
if os.path.exists(PCA_PATH):
    pca = joblib.load(PCA_PATH)
    use_pca = True
    print("✅ PCA loaded")
else:
    pca = None
    use_pca = False
    print("ℹ️ No PCA found, using raw features")

# -----------------------------
# 2️⃣ Predict endpoint
# -----------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if 'features' not in data:
            return jsonify({"error": "JSON must contain 'features' key"}), 400

        features = np.array(data['features'], dtype=float).reshape(1, -1)

        # Apply PCA if available
        if use_pca:
            if features.shape[1] != pca.n_features_:
                return jsonify({
                    "error": f"Input features must have length {pca.n_features_} (PCA expected)"
                }), 400
            features = pca.transform(features)

        # Safe prediction: do NOT access n_features_ for classifiers that may not have it
        prediction = clf.predict(features)
        return jsonify({"prediction": int(prediction[0])})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# -----------------------------
# 3️⃣ Run Flask server
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True)
