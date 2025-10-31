from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user_model import create_user, find_user_by_email, find_user_by_id, verify_password

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              example: johndoe
            email:
              type: string
              example: johndoe@example.com
            password:
              type: string
              example: mysecurepassword
    responses:
      201:
        description: Registration successful
      400:
        description: Missing fields or duplicate user
    """
    data = request.get_json() or {}

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields (username, email, password) are required."}), 400

    user = create_user(username, email, password)
    if not user:
        return jsonify({"error": "User already exists."}), 400

    return jsonify({
        "message": "Registration successful",
        "user": {
            "username": username,
            "email": email
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    User login
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: johndoe@example.com
            password:
              type: string
              example: mysecurepassword
    responses:
      200:
        description: Login successful, returns JWT token
      401:
        description: Invalid credentials
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

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
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_user():
    """
    Get current logged-in user
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      200:
        description: User details
      404:
        description: User not found
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
    }), 200
