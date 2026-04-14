from flask import Blueprint, request, jsonify
from models import db, SOS

sos_bp = Blueprint("sos", __name__)


def parse_optional_float(value, field_name):
    if value in (None, ""):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")


def parse_optional_int(value):
    if value in (None, ""):
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def serialize_sos(sos):
    created_at = sos.created_at.isoformat() if sos.created_at else None
    updated_at = sos.updated_at.isoformat() if sos.updated_at else created_at

    return {
        "id": sos.id,
        "user_id": sos.user_id,
        "message": sos.message,
        "phone": sos.phone or "",
        "city": sos.city or "",
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "priority": sos.priority or "medium",
        "status": sos.status,
        "created_at": created_at,
        "updated_at": updated_at,
    }

@sos_bp.route("/sos", methods=["GET"])
def get_sos():
    sos_list = SOS.query.order_by(SOS.id.desc()).all()
    return jsonify([serialize_sos(s) for s in sos_list])

@sos_bp.route("/sos", methods=["POST"])
def create_sos():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        message = (data.get("message") or "").strip()
        if not message:
            return jsonify({"error": "Message is required"}), 400

        sos = SOS(
            user_id=parse_optional_int(data.get("user_id")),
            message=message,
            phone=(data.get("phone") or "").strip() or None,
            city=(data.get("city") or "").strip() or None,
            latitude=parse_optional_float(data.get("latitude"), "latitude"),
            longitude=parse_optional_float(data.get("longitude"), "longitude"),
            priority=(data.get("priority") or "medium").strip() or "medium",
            status=(data.get("status") or "new").strip() or "new",
        )

        db.session.add(sos)
        db.session.commit()

        return jsonify({
            "message": "SOS request created",
            "sos": serialize_sos(sos),
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create SOS request: {str(e)}"}), 500

@sos_bp.route("/sos/<int:id>", methods=["PATCH"])
def update_sos(id):
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        sos = SOS.query.get(id)
        if not sos:
            return jsonify({"error": "SOS not found"}), 404

        if "status" in data:
            sos.status = data["status"]
        if "message" in data:
            message = (data.get("message") or "").strip()
            if not message:
                return jsonify({"error": "Message cannot be empty"}), 400
            sos.message = message
        if "phone" in data:
            sos.phone = (data.get("phone") or "").strip() or None
        if "city" in data:
            sos.city = (data.get("city") or "").strip() or None
        if "priority" in data:
            sos.priority = (data.get("priority") or "medium").strip() or "medium"
        if "latitude" in data:
            sos.latitude = parse_optional_float(data.get("latitude"), "latitude")
        if "longitude" in data:
            sos.longitude = parse_optional_float(data.get("longitude"), "longitude")

        db.session.commit()
        return jsonify({
            "message": "SOS status updated successfully",
            "sos": serialize_sos(sos),
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update SOS: {str(e)}"}), 500
