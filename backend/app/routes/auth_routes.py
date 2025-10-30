from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user_model import create_user, find_user_by_email, find_user_by_id, verify_password
from bson import ObjectId

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    """
    Register a new user
    ---
    tags:
      - Auth
    """
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({"error": "All fields required"}), 400

    user = create_user(username, email, password)
    if not user:
        return jsonify({"error": "User already exists"}), 400

    return jsonify({"message": "Registration successful"}), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    """
    User login
    ---
    tags:
      - Auth
    """
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = find_user_by_email(email)
    if not user or not verify_password(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"]
        }
    })


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_user():
    """
    Get current logged-in user
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    """
    user_id = get_jwt_identity()
    user = find_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "created_at": user["created_at"]
    })
