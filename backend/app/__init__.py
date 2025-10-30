from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from app.routes import bp as predict_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register blueprint
    app.register_blueprint(predict_bp)

    @app.route("/")
    def home():
        return {"message": "Mine Detection API is running!"}

    # Swagger setup (for visual docs)
    app.config["SWAGGER"] = {
        "title": "Autonomous Landmine Detector API",
        "uiversion": 3
    }
    Swagger(app)

    return app
