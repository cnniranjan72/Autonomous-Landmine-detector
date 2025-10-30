from flask import Blueprint, request, jsonify
import joblib, numpy as np, os, logging

bp = Blueprint("predict_bp", __name__)

# Set up logging
logging.basicConfig(
    filename="mine_detector.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Model path
BASE = os.path.dirname(os.path.abspath(__file__))
PIPE_PATH = os.path.join(BASE, "models", "mine_detector_pipeline.pkl")

# Load model safely
try:
    pipeline = joblib.load(PIPE_PATH)
except Exception as e:
    pipeline = None
    logging.error(f"Failed to load model: {e}")

# Define feature order
FEATURES = [
    'Metal_Level', 'Magnetic_Field', 'Ground_Density', 'Thermal_Signature',
    'Metal_Mag_Ratio', 'Metal_Diff', 'Metal_Mag_Energy', 'Metal_Mag_Avg'
]

@bp.route("/api/predict/mine", methods=["POST"])
def predict_mine():
    """
    Mine detection endpoint.
    ---
    parameters:
      - name: input
        in: body
        required: true
        schema:
          type: array
          items:
            type: number
          example: [0.9, 0.75, 0.8, 0.7, 0.6, 0.1, 0.2, 0.3]
    responses:
      200:
        description: Prediction result
      400:
        description: Invalid input
      500:
        description: Server error
    """
    try:
        if pipeline is None:
            return jsonify({"error": "Model not loaded on server."}), 500

        data = request.get_json(force=True)
        arr = data.get("input")

        if not arr or len(arr) != len(FEATURES):
            return jsonify({
                "error": f"Input must be a list of {len(FEATURES)} numeric values in order: {FEATURES}"
            }), 400

        sample = np.array(arr).reshape(1, -1)
        pred = int(pipeline.predict(sample)[0])
        proba = float(pipeline.predict_proba(sample)[0, 1])

        result = {
            "prediction": pred,
            "probability": proba,
            "message": "Mine detected!" if pred == 1 else "No mine detected."
        }

        logging.info(f"Input: {arr} → {result}")
        return jsonify(result)

    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500
