from flask import Blueprint, jsonify, request, session
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()
bcrypt = Bcrypt()

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


class User(db.Model):
    """Application user account."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Candidate")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new Admin, Company, or Candidate user."""

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "Candidate").strip()

    allowed_roles = {"Admin", "Company", "Candidate"}

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required."}), 400

    if role not in allowed_roles:
        return jsonify({"status": "error", "message": "Role must be Admin, Company, or Candidate."}), 400

    if len(password) < 8:
        return jsonify({"status": "error", "message": "Password must be at least 8 characters."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"status": "error", "message": "Email is already registered."}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(email=email, password=hashed_password, role=role)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User registered successfully.",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        },
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Verify user credentials and start a login session."""

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"status": "error", "message": "Invalid email or password."}), 401

    session.clear()
    session["user_id"] = user.id
    session["email"] = user.email
    session["role"] = user.role

    return jsonify({
        "status": "success",
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        },
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Clear the active login session."""

    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logout successful.",
    }), 200
