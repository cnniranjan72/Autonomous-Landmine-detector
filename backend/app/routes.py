from flask import Blueprint, request, jsonify
import joblib
import numpy as np

api = Blueprint("api", __name__)

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logreg_model = joblib.load(os.path.join(BASE_DIR, "models", "logreg_pca_radar_model.pkl"))
rf_model = joblib.load(os.path.join(BASE_DIR, "models", "randomforest_pca_model.pkl"))

@api.route("/predict/logreg", methods=["POST"])
def predict_logreg():
    data = request.json["input"]
    prediction = logreg_model.predict([data])[0]
    return jsonify({"model": "Logistic Regression PCA", "prediction": int(prediction)})

@api.route("/predict/randomforest", methods=["POST"])
def predict_rf():
    data = request.json["input"]
    prediction = rf_model.predict([data])[0]
    return jsonify({"model": "Random Forest PCA", "prediction": int(prediction)})
