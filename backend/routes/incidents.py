from flask import Blueprint, request, jsonify
from models import db, Incident

incidents_bp = Blueprint("incidents", __name__)


def parse_optional_float(value, field_name):
    if value in (None, ""):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")


def parse_optional_user_id(value):
    if value in (None, ""):
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def serialize_incident(incident):
    created_at = incident.created_at.isoformat() if incident.created_at else None
    updated_at = incident.updated_at.isoformat() if incident.updated_at else created_at

    return {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description or "",
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "city": incident.city or "",
        "priority": incident.priority or "medium",
        "status": incident.status,
        "user_id": incident.user_id,
        "created_at": created_at,
        "updated_at": updated_at,
    }

@incidents_bp.route("/incidents", methods=["POST"])
def create_incident():
    try:
        data = request.get_json(silent=True)
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400
        
        incident = Incident(
            title=title,
            description=(data.get("description") or "").strip() or None,
            latitude=parse_optional_float(data.get("latitude"), "latitude"),
            longitude=parse_optional_float(data.get("longitude"), "longitude"),
            city=(data.get("city") or "").strip() or None,
            priority=(data.get("priority") or "medium").strip() or "medium",
            status=(data.get("status") or "reported").strip() or "reported",
            user_id=parse_optional_user_id(data.get("user_id")),
        )
        
        db.session.add(incident)
        db.session.commit()
        
        return jsonify({
            "message": "Incident reported successfully",
            "incident": serialize_incident(incident),
        }), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create incident: {str(e)}"}), 500

@incidents_bp.route("/incidents", methods=["GET"])
def get_incidents():
    try:
        user_id = request.args.get("user_id")
        
        if user_id:
            # Validate user_id is a valid integer
            try:
                user_id = int(user_id)
                incidents = Incident.query.filter_by(user_id=user_id).order_by(Incident.id.desc()).all()
            except ValueError:
                return jsonify({"error": "Invalid user_id format"}), 400
        else:
            incidents = Incident.query.order_by(Incident.id.desc()).all()
        
        return jsonify([serialize_incident(i) for i in incidents]), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve incidents: {str(e)}"}), 500

@incidents_bp.route("/incidents/<int:id>", methods=["PATCH"])
def update_incident(id):
    try:
        data = request.get_json(silent=True)
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        incident = Incident.query.get(id)
        if not incident:
            return jsonify({"error": "Incident not found"}), 404

        # Update allowed fields
        if "status" in data:
            incident.status = data["status"]
        if "title" in data:
            title = (data.get("title") or "").strip()
            if not title:
                return jsonify({"error": "Title cannot be empty"}), 400
            incident.title = title
        if "description" in data:
            incident.description = (data.get("description") or "").strip() or None
        if "city" in data:
            incident.city = (data.get("city") or "").strip() or None
        if "priority" in data:
            incident.priority = (data.get("priority") or "medium").strip() or "medium"
        if "latitude" in data:
            incident.latitude = parse_optional_float(data.get("latitude"), "latitude")
        if "longitude" in data:
            incident.longitude = parse_optional_float(data.get("longitude"), "longitude")
        
        db.session.commit()
        
        return jsonify({
            "message": "Incident updated successfully",
            "incident": serialize_incident(incident),
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update incident: {str(e)}"}), 500
