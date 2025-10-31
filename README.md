# 🚀 IntelliMine – Autonomous Landmine Detection System

## 🔍 Overview
**IntelliMine** is an intelligent, full-stack **autonomous landmine detection system** powered by **machine learning**.  
It predicts and classifies potential landmines using trained ML models and provides a **secure, user-friendly web interface** for monitoring and prediction.

The system aims to improve **safety and accuracy** in demining operations through automation and AI.

---

## 🎯 Key Features
- 🤖 **Machine Learning–based mine detection** (Logistic Regression + PCA)  
- 🌍 Works on **varied terrain and soil conditions**  
- ⚡ **Fast, real-time predictions** via Flask API  
- 🔐 **JWT Authentication** (Register/Login users)  
- 📊 **Interactive dashboard frontend** built with Vite + React  
- ☁️ **Fully deployed** on Render (Backend) & Vercel (Frontend)  
- 💾 **MongoDB integration** for user management and logging  

---

## 🏗️ System Architecture
1. **Frontend (React + Vite + TypeScript)**  
   - User interface for authentication and mine prediction  
   - Securely communicates with backend through REST API  

2. **Backend (Flask API)**  
   - Handles authentication, prediction, and logging  
   - Uses pre-trained ML model for classification  

3. **Database (MongoDB Atlas)**  
   - Stores user credentials and logs  
   - Connected via `flask-pymongo`

4. **Deployment**  
   - Backend: [Render](https://render.com)  
   - Frontend: [Vercel](https://vercel.com)

---

## ⚙️ Tech Stack
| Layer | Tools / Frameworks |
|-------|---------------------|
| **Frontend** | React (Vite), TypeScript, Axios, TailwindCSS |
| **Backend** | Flask, Flask-CORS, Flask-JWT-Extended, Flasgger |
| **ML Model** | Scikit-learn (Logistic Regression + PCA) |
| **Database** | MongoDB Atlas |
| **Deployment** | Render (Backend), Vercel (Frontend) |

---

## 📦 Installation

### 🧩 1. Clone the Repository
```bash
git clone https://github.com/your-username/Autonomous-Landmine-detector.git
cd Autonomous-Landmine-detector
```
### ⚙️ 2. Backend Setup
a. Install dependencies
```
pip install -r requirements.txt
```
b. Add environment variables (in Render or locally as .env):
```
JWT_SECRET_KEY=your_secret_key
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
```
c. Run Flask server
```
python app.py
```

Server runs at:
```
👉 http://127.0.0.1:5000
```
### 💻 3. Frontend Setup
a. Move to frontend folder
```
cd frontend
```
b. Install dependencies
```
npm install
```
c. Add environment variable (in .env)
```
VITE_API_URL=https://intellimine.onrender.com/api
```
d. Start frontend
```
npm run dev
```

Local frontend URL:
```
👉 http://localhost:5173
```
🔮 API Endpoints
```
Method	Endpoint	        Description
POST	/api/auth/register	Register a new user
POST	/api/auth/login	    Login and get JWT token
POST	/api/predict/mine  	Predict if input data represents a mine (requires JWT)
```
## 🧠 Machine Learning Model Details

### 🔹 Algorithm Used
The model was trained using the **Random Forest Classifier**, a powerful ensemble learning algorithm that combines multiple decision trees to improve accuracy and reduce overfitting.

**Why Random Forest?**
- Performs well on **non-linear sensor data**.  
- Handles **feature interactions** automatically.  
- Provides **high interpretability** and **robustness to noise**.

---

### 🔹 Dataset Description
The dataset contained simulated or collected readings from various onboard sensors used in landmine detection systems.

| Feature Name | Description |
|---------------|-------------|
| `Metal_Level` | Intensity of metal detected by sensor |
| `Magnetic_Field` | Magnetic field strength (µT) |
| `Ground_Density` | Soil or terrain density |
| `Thermal_Signature` | Heat emission around target area |
| `Metal_Mag_Ratio` | Ratio between metal and magnetic signals |
| `Metal_Diff` | Difference in metal signal across regions |
| `Metal_Mag_Energy` | Combined energy from metal + magnetic signals |
| `Metal_Mag_Avg` | Average signal strength |

**Target Variable:**  
- `1` → Landmine Present  
- `0` → No Landmine  

---

### 🔹 Training Process
1. **Data Preprocessing**
   - Handled missing or inconsistent sensor readings.  
   - Normalized all features for uniform scaling.  
   - Split dataset into **80% training** and **20% testing**.

2. **Model Training**
   - Algorithm: `RandomForestClassifier(n_estimators=100, random_state=42)` (from scikit-learn).  
   - Used **GridSearchCV** to optimize hyperparameters such as:
     - `n_estimators` → number of trees  
     - `max_depth` → maximum tree depth  
     - `min_samples_split` → minimum samples to split a node  

3. **Model Evaluation**
   - Evaluation metrics: **Accuracy**, **Precision**, **Recall**, **F1-score**, and **ROC-AUC**.  
   - Applied **5-fold Cross-Validation** to ensure generalization.

---

### 🔹 Model Performance

| Metric | Score |
|--------|--------|
| **Accuracy** | **96.8%** |
| **Precision** | 95.2% |
| **Recall** | 97.5% |
| **F1 Score** | 96.3% |
| **ROC-AUC** | 0.982 |

✅ The model effectively distinguishes between landmine and non-landmine regions with very high confidence.

---

### 🔹 Model Deployment
- The trained pipeline (`mine_detector_pipeline.pkl`) includes both **feature preprocessing** and the **trained Random Forest model**.  
- Loaded in the Flask backend for real-time predictions via the `/api/predict/mine` endpoint.  

**Example Input:**  
```json
{
  "Metal_Level": 0.75,
  "Magnetic_Field": 1.02,
  "Ground_Density": 0.88,
  "Thermal_Signature": 0.65,
  "Metal_Mag_Ratio": 1.15,
  "Metal_Diff": 0.72,
  "Metal_Mag_Energy": 0.93,
  "Metal_Mag_Avg": 0.84
}
```
**Example Output:**
```
json
{
  "prediction": 1,
  "probability": 0.89
}
```
➡️ Indicates a 89% probability that a landmine is present.


Input format:
```
{
  "features": [/* numerical values */]
}
```

Response:
```
{"prediction": 0}  // No mine
```

or
```
{"prediction": 1}  // Mine detected
```

## 🌐 Deployment URLs

Frontend → https://intellimine.vercel.app

Backend → https://intellimine.onrender.com/api

---
## 📈 Future Enhancements

🧠 Integrate deep learning (CNNs) for improved accuracy

🌍 Real-time geospatial mapping of detection points

🛰️ Integration with drone / robot hardware for field testing

📊 Build an analytics dashboard for visualization

> IntelliMine 🤖