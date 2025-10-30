from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import joblib, numpy as np, os, logging

bp = Blueprint("predict_bp", __name__)

logging.basicConfig(filename="mine_detector.log", level=logging.INFO)

BASE = os.path.dirname(os.path.abspath(__file__))
PIPE_PATH = os.path.join(BASE, "..", "models", "mine_detector_pipeline.pkl")

try:
    pipeline = joblib.load(PIPE_PATH)
except Exception as e:
    pipeline = None
    logging.error(f"Failed to load model: {e}")

FEATURES = [
    'Metal_Level', 'Magnetic_Field', 'Ground_Density', 'Thermal_Signature',
    'Metal_Mag_Ratio', 'Metal_Diff', 'Metal_Mag_Energy', 'Metal_Mag_Avg'
]

@bp.route("/api/predict/mine", methods=["POST"])
@jwt_required()
def predict_mine():
    """
    Predict landmine presence using sensor data
    ---
    tags:
      - Prediction
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            input:
              type: array
              items:
                type: number
              example: [10, 0.5, 30, 12, 1.1, 0.8, 0.9, 0.7]
    responses:
      200:
        description: Prediction result
    """
    try:
        if pipeline is None:
            return jsonify({"error": "Model not loaded."}), 500

        data = request.get_json(force=True)
        arr = data.get("input")

        if not arr or len(arr) != len(FEATURES):
            return jsonify({"error": "Invalid input format"}), 400

        sample = np.array(arr).reshape(1, -1)
        pred = int(pipeline.predict(sample)[0])
        proba = float(pipeline.predict_proba(sample)[0, 1])

        result = {"prediction": pred, "probability": proba}
        logging.info(f"Input: {arr} → {result}")
        return jsonify(result)
    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500
