from flask import Blueprint, request, jsonify
from models import db, Incident

incidents_bp = Blueprint("incidents", __name__)

from flask import Blueprint, request, jsonify
from models import db, Incident

incidents_bp = Blueprint("incidents", __name__)

@incidents_bp.route("/incidents", methods=["POST"])
def create_incident():
    try:
        data = request.json
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        if "title" not in data or not data["title"]:
            return jsonify({"error": "Title is required"}), 400
        
        # Create incident with proper error handling
        incident = Incident(
            title=data["title"],
            description=data.get("description"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            user_id=data.get("user_id")
        )
        
        db.session.add(incident)
        db.session.commit()
        
        # Return created incident data with 201 status
        return jsonify({
            "message": "Incident reported successfully",
            "incident": {
                "id": incident.id,
                "title": incident.title,
                "description": incident.description,
                "latitude": incident.latitude,
                "longitude": incident.longitude,
                "status": incident.status,
                "user_id": incident.user_id,
                "created_at": incident.created_at.isoformat() if incident.created_at else None
            }
        }), 201
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
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
                incidents = Incident.query.filter_by(user_id=user_id).all()
            except ValueError:
                return jsonify({"error": "Invalid user_id format"}), 400
        else:
            incidents = Incident.query.all()
        
        return jsonify([{
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "status": i.status,
            "user_id": i.user_id,
            "created_at": i.created_at.isoformat() if i.created_at else None
        } for i in incidents]), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve incidents: {str(e)}"}), 500

@incidents_bp.route("/incidents/<int:id>", methods=["PATCH"])
def update_incident(id):
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        incident = Incident.query.get(id)
        if not incident:
            return jsonify({"error": "Incident not found"}), 404

        # Update allowed fields
        if "status" in data:
            incident.status = data["status"]
        if "title" in data:
            incident.title = data["title"]
        if "description" in data:
            incident.description = data["description"]
        
        db.session.commit()
        
        return jsonify({
            "message": "Incident updated successfully",
            "incident": {
                "id": incident.id,
                "title": incident.title,
                "description": incident.description,
                "latitude": incident.latitude,
                "longitude": incident.longitude,
                "status": incident.status,
                "user_id": incident.user_id,
                "created_at": incident.created_at.isoformat() if incident.created_at else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update incident: {str(e)}"}), 500
