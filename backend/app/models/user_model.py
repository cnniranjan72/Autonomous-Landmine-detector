from werkzeug.security import generate_password_hash, check_password_hash
from app import mongo
from datetime import datetime

def create_user(username, email, password):
    users = mongo.db.users
    existing_user = users.find_one({"$or": [{"username": username}, {"email": email}]})
    if existing_user:
        return None  # duplicate

    password_hash = generate_password_hash(password)
    new_user = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.utcnow()
    }
    users.insert_one(new_user)
    return new_user

def find_user_by_email(email):
    return mongo.db.users.find_one({"email": email})

def find_user_by_id(user_id):
    from bson import ObjectId
    return mongo.db.users.find_one({"_id": ObjectId(user_id)})

def verify_password(password_hash, password):
    return check_password_hash(password_hash, password)
