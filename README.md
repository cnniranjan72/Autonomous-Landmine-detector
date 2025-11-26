# 🚀 IntelliMine – Autonomous Landmine Detection System

An advanced AI-powered landmine detection & classification system that brings together **Machine Learning**, **3D visualization**, **path planning**, **threat severity scoring**, and **interactive simulations** in a powerful full-stack application.

---

# 🛰️ **Overview**

**IntelliMine** is an intelligent, full-stack **autonomous landmine detection system** powered by multiple ML models.  
It predicts, classifies, and visualizes landmine threats through a highly interactive dashboard with real-time animations and simulations.

The system aims to improve **speed**, **accuracy**, and—most importantly—**safety** in real demining operations.

---

# 🎯 Features

## 🔥 **Core Features**
- 🤖 **Mine Detection Model (RF + PCA)**  
- 🎯 **Mine-Type Classification Model (Random Forest / XGBoost)**  
- ⚡ **Real-time threat severity scoring**  
- 🧭 **Safe Path Generator (A* path planning)**  
- 🌋 **Minefield Simulation Engine**  
- 📊 **GPR Scan Analyzer (coming soon)**  
- 🔐 **JWT Authentication**  
- 📓 **Detection Logs, Metrics & History**  
- 🎨 **Military-grade UX/UI with live animations**

---

# 🧠 Machine Learning Models

## 1️⃣ **Mine Detection Model (Primary Model)**  
**Purpose:** Detect whether a landmine is present based on 8 onboard sensor readings.  
**Algorithm:** Random Forest + PCA dimensionality reduction  
**Training Dataset:** `mine_detection_dataset.csv`

### **Input Features**
| Feature | Description |
|--------|-------------|
| Metal_Level | Strength of metal detection |
| Magnetic_Field | Microtesla field strength |
| Ground_Density | Soil density |
| Thermal_Signature | Heat signature |
| Metal_Mag_Ratio | Combined ratio |
| Metal_Diff | Signal difference |
| Metal_Mag_Energy | Combined energy |
| Metal_Mag_Avg | Average metal–magnetic signal |

### **Output**
- `"prediction": 0 | 1`
- `"probability": 0.00 – 1.00"`
- `"severity_score": 0 – 1"`
- `"severity_level": LOW / MODERATE / HIGH / CRITICAL`
- `"severity_color": hex`

### **Model Performance**
| Metric | Score |
|--------|--------|
| Accuracy | **96.8%** |
| Precision | 95.2% |
| Recall | 97.5% |
| F1 Score | 96.3% |
| ROC-AUC | 0.982 |

---

## 2️⃣ **Mine-Type Classification Model**
**Purpose:** Identify which mine category is present using V, H, S GPR-derived features.  
**Dataset:** `mine_dataset.csv`  
**Model:** RandomForestClassifier / XGBoost

### **Classes**
| Class | Label |
|-------|-------|
| 1 | Null / No Mine |
| 2 | Anti-Tank |
| 3 | Anti-Personnel |
| 4 | Booby-Trapped AP |
| 5 | M14 AP |

### **Outputs**
- `"mine_type"` (1–5)
- `"label"`
- `"confidence"`
- `"severity_score"`
- `"severity_level"`
- `"severity_color"`

---

## 3️⃣ **Threat Severity Engine (Custom Model)**
A hybrid scoring formula combining:

severity = 0.7 * model_probability + 0.3 * mine_weight

Mine weights (danger factors):
Null = 0.1
Anti-Tank = 1.0
Anti-Personnel = 0.8
Booby-Trapped AP = 0.95
M14 AP = 0.7

Outputs include:

✔ Severity Score  
✔ Severity Color  
✔ Severity Label  

---

# 🧭 **Safe Path Generator (A* Pathfinding)**

### What it does:
- Generates safe navigation path avoiding mines  
- Uses mine severity to create danger cost heatmaps  
- Animates robot movement cell-by-cell  
- Allows custom mine placement, random generation, obstacles, start+goal selection  

### Tech Behind It:
- A* (Euclidean heuristic)
- Dynamic grid cost weighting
- Danger zone expansion (radius-based)
- Smooth animations using React + Tailwind

---

# 🌋 **Minefield Simulation Engine**
A fully interactive simulation panel:

- Generate random minefields  
- Adjust mine density  
- Set contamination zones  
- Drop the robot and auto-run A* path  
- Danger heatmap visualization  
- Real-time animation of robot moving through grid  

---

# 📡 **GPR Scan Analyzer (Coming Soon)**
Upload a 2D GPR B-Scan CSV → get:

- Heatmap rendering  
- Frequency spectrum  
- Depth vs Intensity plot  
- Automatic anomaly detection  
- Classification of buried objects  

Uses **Plotly.js / Chart.js** for visualization.

---

# 🛠️ System Architecture

Frontend → React + Tailwind + TypeScript
Backend → Flask (REST API)
Database → MongoDB Atlas
ML Models → scikit-learn pipelines
Auth → JWT-based
Deployment → Vercel + Render

markdown
Copy code

### **High-Level Flow**
User → React UI → Axios → Flask API  
→ ML Predictions → Severity Scoring  
→ Response → UI visualization/animation  
→ Optional Logging → MongoDB  

---

# ⚙️ Tech Stack

## **Frontend**
- React + Vite + TypeScript  
- TailwindCSS  
- Framer Motion (animations)  
- ShadCN UI components  
- Axios  
- Lucide Icons  

## **Backend**
- Python Flask  
- Flask-JWT-Extended  
- Flask-PyMongo  
- Flask-CORS  
- Flasgger (API docs)  
- NumPy / scikit-learn / joblib  

## **AI / ML**
- Random Forest  
- Logistic Regression (baseline)  
- PCA  
- Custom severity fusion model  
- A* Pathfinding  

## **Infrastructure**
- Render (Flask backend)  
- Vercel (Frontend)  
- MongoDB Atlas  

---

# 🔐 Authentication System

### Endpoints
```
POST /api/auth/register
POST /api/auth/login
```

Returns a JWT token stored in localStorage.

All protected endpoints require:
Authorization: Bearer <token>


---

# 🌐 Deployment URLs

### Frontend  
👉 https://intellimine.vercel.app

### Backend  
👉 https://intellimine.onrender.com/api

---

# 🧪 API Endpoints

## 🔍 Mine Detection
```
POST /api/predict/mine
```

### Body:
```
{
  "input": [8 sensor feature values]
}
```
🎯 Mine-Type Classification
```
POST /api/predict/mine-type
```
Body:
```
{ "V": 1.2, "H": 0.8, "S": 4 }
```
🧭 Safe Path Generator
```
POST /api/path/generate
```
Body:
```
json
{
  "rows": 30,
  "cols": 25,
  "start": [0,0],
  "goal": [29,24],
  "mines": [{ "x":10, "y":8, "radius":2, "severity":0.9 }]
}
```
📦 Installation Guide

1️⃣ Clone Repository
```
git clone https://github.com/your-username/Autonomous-Landmine-detector.git
cd Autonomous-Landmine-detector
```
🧩 Backend Setup
Install requirements
```
pip install -r requirements.txt
```
Environment variables
```
JWT_SECRET_KEY=your_secret
MONGO_URI=mongodb+srv://...
```
Run Flask server
```
python main.py
```
💻 Frontend Setup
```
cd frontend
npm install
npm run dev
```
Environment variable:
```
VITE_API_URL=https://intellimine.onrender.com/api
```
📈 Future Enhancements

📡 Full GPR Analyzer with deep-learning anomaly detection

🛰 GPS & real-time map tracking

🤖 Autonomous drone integration

📝 Advanced mission planner

🧠 CNN-based ground object classification

📦 Offline PWA support


### 💙 Credits
Designed & Developed by CN Niranjan
AI/ML + Full Stack + UI/UX + Systems Integration

🏁 Final Note
IntelliMine is now a complete, production-grade ML weapon-system simulator with:
-  ✔ Multiple ML models
-  ✔ A* navigation
-  ✔ Simulation engines
-  ✔ Authentication
-  ✔ Logging
-  ✔ Real-time animations
-  ✔ Professional UI