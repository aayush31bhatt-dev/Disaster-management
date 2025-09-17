from flask import Blueprint, request, jsonify
from models import db, Shelter

shelters_bp = Blueprint("shelters", __name__)

@shelters_bp.route("/shelters", methods=["GET"])
def get_shelters():
    shelters = Shelter.query.all()
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "capacity": s.capacity,
        "contact": s.contact
    } for s in shelters])

@shelters_bp.route("/shelters", methods=["POST"])
def add_shelter():
    data = request.json
    shelter = Shelter(
        name=data["name"],
        latitude=data["latitude"],
        longitude=data["longitude"],
        capacity=data["capacity"],
        contact=data["contact"]
    )
    db.session.add(shelter)
    db.session.commit()
    return jsonify({"message": "Shelter added successfully"})
