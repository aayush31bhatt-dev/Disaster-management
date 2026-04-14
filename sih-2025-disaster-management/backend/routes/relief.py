from flask import Blueprint, request, jsonify
from models import db, Relief

relief_bp = Blueprint("relief", __name__)

@relief_bp.route("/relief", methods=["GET"])
def get_relief():
    reliefs = Relief.query.all()
    return jsonify([{
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "posted_by": r.posted_by
    } for r in reliefs])

@relief_bp.route("/relief", methods=["POST"])
def add_relief():
    data = request.json
    relief = Relief(
        title=data["title"],
        description=data["description"],
        latitude=data["latitude"],
        longitude=data["longitude"],
        posted_by=data.get("posted_by")
    )
    db.session.add(relief)
    db.session.commit()
    return jsonify({"message": "Relief update posted successfully"})
