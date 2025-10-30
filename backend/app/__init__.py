from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo

mongo = PyMongo()

def create_app():
    app = Flask(__name__)

    # --- Config ---
    app.config["SECRET_KEY"] = "supersecretkey"
    app.config["JWT_SECRET_KEY"] = "jwtsecretkey"
    app.config["MONGO_URI"] = "mongodb://localhost:27017/mine_detector"

    # --- Init ---
    mongo.init_app(app)
    jwt = JWTManager(app)

    # --- CORS ---
    CORS(
        app,
        resources={r"/*": {"origins": ["http://localhost:*", "http://127.0.0.1:*"]}},
        supports_credentials=True
    )

    # --- Import Blueprints ---
    from app.routes.auth_routes import auth_bp
    from app.routes.predict_routes import bp as predict_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(predict_bp)

    # --- Swagger setup with JWT ---
    template = {
        "swagger": "2.0",
        "info": {
            "title": "Autonomous Landmine Detector API",
            "description": "API with MongoDB + JWT Authentication",
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

    @app.route("/")
    def home():
        return {"message": "Mine Detection API (MongoDB) is running!"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="127.0.0.1", port=5000)
