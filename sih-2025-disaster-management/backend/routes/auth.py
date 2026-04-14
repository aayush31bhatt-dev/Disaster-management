from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        if not data:
            return jsonify({"message": "No JSON data provided"}), 400
        
        if "username" not in data or "password" not in data:
            return jsonify({"message": "Username and password are required"}), 400
        
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"message": "User already exists"}), 400

        user = User(
            username=data["username"],
            password=generate_password_hash(data["password"]),
            role=data.get("role", "user")
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"})
    except Exception as e:
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"message": "No JSON data provided"}), 400
        
        if "username" not in data or "password" not in data:
            return jsonify({"message": "Username and password are required"}), 400
        
        user = User.query.filter_by(username=data["username"]).first()
        if user and check_password_hash(user.password, data["password"]):
            return jsonify({
                "message": "Login successful",
                "user_id": user.id,
                "role": user.role
            })
        return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"message": f"Login failed: {str(e)}"}), 500

@auth_bp.route("/users", methods=["GET"])
def get_users():
    """Get list of users (for admin purposes like showing usernames)"""
    try:
        users = User.query.all()
        return jsonify([{
            "id": user.id,
            "username": user.username,
            "role": user.role
        } for user in users])
    except Exception as e:
        return jsonify({"message": f"Failed to fetch users: {str(e)}"}), 500

@auth_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        return jsonify({
            "id": user.id,
            "username": user.username,
            "role": user.role
        })
    except Exception as e:
        return jsonify({"message": f"Failed to fetch user: {str(e)}"}), 500
