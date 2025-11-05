import os
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo

mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # --- Config ---
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "supersecretkey")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwtsecretkey")
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/mine_detector_db")

    mongo.init_app(app)
    jwt.init_app(app)

    # --- ✅ Single CORS setup ---
    CORS(
        app,
        resources={r"/api/*": {"origins": [
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "https://intellimine.vercel.app"
        ]}},
        supports_credentials=True
    )

    # --- Swagger setup ---
    Swagger(app, template={
        "swagger": "2.0",
        "info": {
            "title": "IntelliMine API",
            "version": "1.0",
            "description": "Autonomous Landmine Detection System API"
        },
    })

    from app.routes.auth_routes import auth_bp
    from app.routes.predict_routes import bp as predict_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")

    @app.route("/")
    def home():
        return jsonify({"message": "✅ IntelliMine API running", "status": "ok"})

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="127.0.0.1", port=5000)
