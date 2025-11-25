# backend/app/routes/predict_routes.py
from flask import Blueprint, request, jsonify
import joblib, numpy as np, os, logging
from heapq import heappush, heappop
import math
import random

bp = Blueprint("predict_bp", __name__)

# Logging setup
logging.basicConfig(
    filename="mine_detector.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Model path (existing)
BASE = os.path.dirname(os.path.abspath(__file__))
PIPE_PATH = os.path.join(BASE, "..", "models", "mine_detector_pipeline.pkl")

# Load pipeline model (existing)
try:
    pipeline = joblib.load(PIPE_PATH)
    logging.info("✅ Model loaded successfully.")
except Exception as e:
    pipeline = None
    logging.error(f"❌ Failed to load model: {e}")

# Feature order (existing)
FEATURES = [
    'Metal_Level', 'Magnetic_Field', 'Ground_Density', 'Thermal_Signature',
    'Metal_Mag_Ratio', 'Metal_Diff', 'Metal_Mag_Energy', 'Metal_Mag_Avg'
]

# Tabular model paths & load (existing) ...
TABULAR_DIR = os.path.join(BASE, "..", "models")
SCALER_PATH = os.path.join(TABULAR_DIR, "scaler.pkl")
MODEL_PATH = os.path.join(TABULAR_DIR, "rf_tabular_model.pkl")

try:
    tab_scaler = joblib.load(SCALER_PATH)
    tab_model = joblib.load(MODEL_PATH)
    logging.info("✅ Tabular model + scaler loaded successfully.")
except Exception as e:
    tab_scaler = None
    tab_model = None
    logging.error(f"❌ Failed to load tabular model: {e}")

MINE_LABELS = {
    1: "Null",
    2: "Anti-Tank",
    3: "Anti-Personnel",
    4: "Booby-Trapped AP",
    5: "M14 AP"
}

# A few helper functions & severity logic (mirrored from your current file)
MINE_WEIGHTS = {
    1: 0.1,
    2: 1.0,
    3: 0.8,
    4: 0.95,
    5: 0.7
}

def severity_from(probability: float, mine_weight: float) -> dict:
    try:
        prob = float(np.clip(probability, 0.0, 1.0))
    except:
        prob = 0.0
    mw = float(np.clip(mine_weight, 0.0, 1.0))
    score = round((prob * 0.7) + (mw * 0.3), 3)
    if score < 0.25:
        level = "LOW"; color = "#16a34a"
    elif score < 0.50:
        level = "MODERATE"; color = "#f59e0b"
    elif score < 0.75:
        level = "HIGH"; color = "#f97316"
    else:
        level = "CRITICAL"; color = "#ef4444"
    return {"score": score, "level": level, "color": color}

# --- Existing endpoints (predict_mine, predict_mine_type) ---
@bp.route("/predict/mine", methods=["POST"])
def predict_mine():
    try:
        if pipeline is None:
            return jsonify({"error": "Model not loaded on server."}), 500
        data = request.get_json(force=True)
        arr = data.get("input")
        if not arr or len(arr) != len(FEATURES):
            return jsonify({"error": f"Expected {len(FEATURES)} numeric values in order: {FEATURES}"}), 400
        sample = np.array(arr, dtype=float).reshape(1, -1)
        pred = int(pipeline.predict(sample)[0])
        proba = float(pipeline.predict_proba(sample)[0, 1])
        mine_weight = 0.8 if pred == 1 else 0.1
        sev = severity_from(proba, mine_weight)
        result = {
            "prediction": pred,
            "probability": round(proba, 3),
            "message": "⚠️ Mine detected!" if pred == 1 else "✅ No mine detected.",
            "severity_score": sev["score"],
            "severity_level": sev["level"],
            "severity_color": sev["color"]
        }
        logging.info(f"Input: {arr} → {result}")
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route("/predict/mine-type", methods=["POST"])
def predict_mine_type():
    try:
        if tab_model is None:
            return jsonify({"error": "Tabular model not loaded."}), 500
        data = request.get_json(force=True)
        if not all(k in data for k in ["V", "H", "S"]):
            return jsonify({"error": "Expected JSON: { 'V': float, 'H': float, 'S': int }"}), 400
        V = float(data["V"]); H = float(data["H"]); S = int(data["S"])
        sample = np.array([[V, H, S]], dtype=float)
        sample_scaled = tab_scaler.transform(sample)
        pred_class = int(tab_model.predict(sample_scaled)[0])
        try:
            proba = float(tab_model.predict_proba(sample_scaled)[0][pred_class - 1])
        except Exception:
            try:
                proba = float(np.max(tab_model.predict_proba(sample_scaled)[0]))
            except:
                proba = 0.0
        mine_weight = MINE_WEIGHTS.get(pred_class, 0.5)
        sev = severity_from(proba, mine_weight)
        response = {
            "mine_type": pred_class,
            "label": MINE_LABELS.get(pred_class, "Unknown"),
            "confidence": round(proba, 3),
            "severity_score": sev["score"],
            "severity_level": sev["level"],
            "severity_color": sev["color"]
        }
        logging.info(f"Tabular input: {data} → {response}")
        return jsonify(response), 200
    except Exception as e:
        logging.error(f"Tabular prediction error: {e}")
        return jsonify({"error": str(e)}), 500

# --- NEW: Safe Path Generator Endpoint ---
def heuristic(a, b):
    # Euclidean heuristic
    return math.hypot(b[0] - a[0], b[1] - a[1])

def neighbors(node, max_x, max_y):
    # 8-connected
    x, y = node
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < max_x and 0 <= ny < max_y:
                yield (nx, ny)

def a_star(grid_cost, start, goal):
    max_x = len(grid_cost)
    max_y = len(grid_cost[0])
    open_set = []
    heappush(open_set, (0 + heuristic(start, goal), 0, start, None))
    came_from = {}
    gscore = {start: 0}

    while open_set:
        f, g, current, _ = heappop(open_set)
        if current == goal:
            # reconstruct path
            path = []
            node = current
            while node:
                path.append(node)
                node = came_from.get(node)
            path.reverse()
            return path
        for nb in neighbors(current, max_x, max_y):
            # movement cost = grid_cost at neighbor * movement distance (sqrt2 if diagonal)
            step_cost = grid_cost[nb[0]][nb[1]]
            move_cost = math.hypot(nb[0] - current[0], nb[1] - current[1])
            tentative_g = g + (step_cost * move_cost)
            if tentative_g < gscore.get(nb, float("inf")):
                came_from[nb] = current
                gscore[nb] = tentative_g
                fscore = tentative_g + heuristic(nb, goal)
                heappush(open_set, (fscore, tentative_g, nb, current))
    return None  # no path

@bp.route("/path/generate", methods=["POST"])
def generate_path():
    """
    Request JSON:
    {
      "width": 40,
      "height": 30,
      "start": [x,y],
      "goal": [x,y],
      "mines": [ {"x":10,"y":12,"radius":2,"severity":0.9}, ... ]  // optional
      "obstacle_threshold": 0.7  // severity threshold to treat as solid obstacle
    }
    Response:
    {
      "grid_size": [w,h],
      "danger_zones": [ {x,y,radius,severity}, ... ],
      "path": [[x,y],...],
      "grid_cost_sample": [[...],...]  // a small sample or encoding — optional
    }
    """
    try:
        payload = request.get_json(force=True)
        W = int(payload.get("width", 40))
        H = int(payload.get("height", 30))
        start = tuple(payload.get("start", [0, 0]))
        goal = tuple(payload.get("goal", [W-1, H-1]))
        mines = payload.get("mines", None)
        obstacle_threshold = float(payload.get("obstacle_threshold", 0.75))

        # If no mines passed, generate sample random mine points for demo
        if not mines:
            random.seed(42)
            mines = []
            for _ in range(6):
                mx = random.randint(2, W-3)
                my = random.randint(2, H-3)
                severity = round(random.uniform(0.4, 1.0), 2)
                radius = random.randint(1, 3)
                mines.append({"x": mx, "y": my, "radius": radius, "severity": severity})

        # Build grid cost map: base cost 1.0, add large cost near mines
        grid_cost = [[1.0 for _ in range(H)] for _ in range(W)]

        danger_zones = []
        for m in mines:
            mx = int(m.get("x"))
            my = int(m.get("y"))
            radius = int(m.get("radius", 2))
            severity = float(m.get("severity", 0.8))
            danger_zones.append({"x": mx, "y": my, "radius": radius, "severity": severity})
            # for each cell in radius, increase cost by severity-scaled factor
            for i in range(max(0, mx - radius - 1), min(W, mx + radius + 1)):
                for j in range(max(0, my - radius - 1), min(H, my + radius + 1)):
                    dist = math.hypot(i - mx, j - my)
                    if dist <= radius + 0.5:
                        # cost increases quickly near the core
                        add_cost = 1.0 + (severity * (1 + (radius - dist)))
                        grid_cost[i][j] += add_cost

        # Convert to 2D list with [x][y] indexing as above
        # If severity >= threshold mark cell as obstacle by setting huge cost
        for i in range(W):
            for j in range(H):
                if grid_cost[i][j] > (1.0 + obstacle_threshold * 5.0):
                    # treat as very expensive but allow path to go if no alternative
                    grid_cost[i][j] = grid_cost[i][j] * 10.0

        # clamp start/goal inside bounds
        sx, sy = max(0, min(W-1, start[0])), max(0, min(H-1, start[1]))
        gx, gy = max(0, min(W-1, goal[0])), max(0, min(H-1, goal[1]))

        path = a_star(grid_cost, (sx, sy), (gx, gy))
        if path is None:
            # if no path found, try relaxing costs by halving temporarily
            flat = [[c * 0.5 for c in col] for col in grid_cost]
            path = a_star(flat, (sx, sy), (gx, gy))

        # Convert path to list of lists
        path_coords = [ [int(x), int(y)] for (x,y) in path ] if path else []

        response = {
            "grid_size": [W, H],
            "danger_zones": danger_zones,
            "path": path_coords,
            # For frontend demo we include a sparse sample of costs for visualization (downsampled)
            "grid_cost_sample": None
        }

        logging.info(f"Generated path start={start} goal={goal} mines={len(danger_zones)} path_len={len(path_coords)}")
        return jsonify(response), 200

    except Exception as e:
        logging.error(f"Path generation error: {e}")
        return jsonify({"error": str(e)}), 500
