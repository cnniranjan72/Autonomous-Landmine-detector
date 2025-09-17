# 🚀 Autonomous Landmine Detection System

## 🔍 Overview
An intelligent **autonomous landmine detection system** that leverages **machine learning** to detect and classify buried landmines using **Ground-Penetrating Radar (GPR)** data.  
The system is designed for **safe, real-time mine detection** and can be integrated into UAVs (drones) or ground robots.

---

## 🎯 Key Features
- 🛰️ Works with **GPR sensor data**  
- 🤖 **Machine learning-based detection** for high accuracy  
- 🌍 Handles **different soil conditions & mine types**  
- ⚡ **Real-time prediction** for field operations  
- 🚁 Ready for deployment on **UAVs & ground robots**  
- 📍 **Prediction results** can be logged and visualized  
- 🔒 Low **false positive rate** to enhance safety  

---

## 🏗️ System Architecture
1. **Data Acquisition** → Collect raw GPR sensor inputs  
2. **Preprocessing** → Flatten radargrams, normalization  
3. **Detection Models** →  
   - **RandomForest + PCA** → baseline ML pipeline, robust for small datasets  
   - **LogisticRegression + PCA** → better generalization, high cross-validation accuracy  
4. **Prediction API** → Flask server with `/predict` endpoint  
5. **Integration** → Connect predictions to frontend or dashboard for visualization  

---

## ⚙️ Tech Stack
- **Languages**: Python  
- **Machine Learning**: scikit-learn (RandomForest, LogisticRegression, PCA)  
- **Backend**: Flask API  
- **Deployment**: Local server / Postman testing  
- **Visualization**: Optional React frontend or Jupyter notebooks  

---

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-username/Autonomous-Landmine-detector.git
cd Autonomous-Landmine-detector
```

### 2. Set up Python environment

```
python -m venv env
source env/bin/activate  # Linux/Mac
env\Scripts\activate     # Windows

pip install -r requirements.txt
```

# 🧪 Usage


### 1. Run Jupyter Notebooks

Notebooks/ contains:

-> landmine_detection.ipynb → dataset exploration & preprocessing

-> MineClassifier.ipynb → model training, evaluation, PCA, and saving .pkl files

### 2. Run Flask Server

```
cd app
python app.py
```

-> Server runs at http://127.0.0.1:5000

-> /predict endpoint accepts POST requests with JSON payload:
```
{
  "features": [/* flattened radargram values (74800) */]
}
```
### 3. Testing Predictions

-> Use Postman or curl to test:
```
curl -X POST http://127.0.0.1:5000/predict \
-H "Content-Type: application/json" \
-d @sample_input.json
```

-> Response:
```
{"prediction": 0}
```

or
```
{"prediction": 1}
```
# 📊 Models
```
Model	Features	CV Accuracy	Notes
RandomForest + PCA	30 PCA components	~89.5%	Baseline, stable
LogisticRegression + PCA	30 PCA components	~93.8%	Best generalization, recommended
```
Models saved in models/ folder:
```
randomforest_pca_model.pkl

logreg_pca_radar_model.pkl
```
# 📝 Reports

-> Reports/ contains:
```
MineClassifier.pdf → notebook export with results & plots

NotebookReports.pdf → additional visualizations
```
# 📌 Future Enhancements

🌐 Integration with UAV & robot hardware for autonomous deployment

🧠 Explore CNN-based detection for improved accuracy with larger datasets

📍 Real-time geospatial mapping & visualization

⚡ Optimizations for speed and low-latency predictions
