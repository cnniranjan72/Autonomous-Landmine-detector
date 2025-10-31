import os
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo
from os import getenv
mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # --- Config ---
    app.config["SECRET_KEY"] = "supersecretkey"
    app.config["JWT_SECRET_KEY"] = "jwtsecretkey"
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/mine_detector_db")

    # --- Init ---
    mongo.init_app(app)
    jwt.init_app(app)

    # --- ✅ Enable CORS globally (for frontend connection) ---
    CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"]
)


    # --- Import Blueprints ---
    from app.routes.auth_routes import auth_bp
    from app.routes.predict_routes import bp as predict_bp

    # ✅ Use consistent prefixes
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")

    # --- Swagger setup ---
    template = {
        "swagger": "2.0",
        "info": {
            "title": "Autonomous Landmine Detector API",
            "description": "API using MongoDB + JWT Authentication + ML Prediction",
            "version": "1.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using Bearer scheme. Example: 'Bearer {token}'"
            }
        },
        "security": [{"Bearer": []}],
    }

    Swagger(app, template=template)

    # --- Simple home route ---
    @app.route("/")
    def home():
        return jsonify({"message": "Mine Detection API (MongoDB + JWT) is running!"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="127.0.0.1", port=5000)
