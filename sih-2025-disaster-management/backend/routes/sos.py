from flask import Blueprint, request, jsonify
from models import db, SOS

sos_bp = Blueprint("sos", __name__)

@sos_bp.route("/sos", methods=["GET"])
def get_sos():
    sos_list = SOS.query.all()
    return jsonify([{
        "id": s.id,
        "user_id": s.user_id,
        "message": s.message,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "status": s.status
    } for s in sos_list])

@sos_bp.route("/sos", methods=["POST"])
def create_sos():
    data = request.json
    sos = SOS(
        user_id=data.get("user_id"),
        message=data["message"],
        latitude=data.get("latitude"),
        longitude=data.get("longitude")
    )
    db.session.add(sos)
    db.session.commit()
    return jsonify({"message": "SOS request created"})

@sos_bp.route("/sos/<int:id>", methods=["PATCH"])
def update_sos(id):
    data = request.json
    sos = SOS.query.get(id)
    if not sos:
        return jsonify({"error": "SOS not found"}), 404

    if "status" in data:
        sos.status = data["status"]

    db.session.commit()
    return jsonify({"message": "SOS status updated successfully"})
