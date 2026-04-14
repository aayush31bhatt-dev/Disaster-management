import json

from flask import Blueprint, request, jsonify
from models import db, Shelter

shelters_bp = Blueprint("shelters", __name__)


def parse_required_float(value, field_name):
    if value in (None, ""):
        raise ValueError(f"{field_name} is required")

    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")


def parse_optional_float(value, field_name):
    if value in (None, ""):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")


def parse_required_int(value, field_name):
    if value in (None, ""):
        raise ValueError(f"{field_name} is required")

    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid integer")


def parse_optional_int(value, default=0):
    if value in (None, ""):
        return default

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_facilities(raw_facilities):
    if not raw_facilities:
        return []

    if isinstance(raw_facilities, list):
        return [str(item).strip() for item in raw_facilities if str(item).strip()]

    if isinstance(raw_facilities, str):
        try:
            decoded = json.loads(raw_facilities)
            if isinstance(decoded, list):
                return [str(item).strip() for item in decoded if str(item).strip()]
        except json.JSONDecodeError:
            return [item.strip() for item in raw_facilities.split(",") if item.strip()]

    return []


def serialize_shelter(shelter):
    occupied = shelter.occupied or 0
    capacity = shelter.capacity or 0

    return {
        "id": shelter.id,
        "name": shelter.name,
        "city": shelter.city or "",
        "address": shelter.address or "",
        "latitude": shelter.latitude,
        "longitude": shelter.longitude,
        "capacity": capacity,
        "occupied": occupied,
        "available": max(capacity - occupied, 0),
        "contact": shelter.contact or "",
        "facilities": normalize_facilities(shelter.facilities),
        "status": shelter.status or "active",
        "created_at": shelter.created_at.isoformat() if shelter.created_at else None,
        "updated_at": shelter.updated_at.isoformat() if shelter.updated_at else None,
    }

@shelters_bp.route("/shelters", methods=["GET"])
def get_shelters():
    shelters = Shelter.query.order_by(Shelter.id.desc()).all()
    return jsonify([serialize_shelter(s) for s in shelters])

@shelters_bp.route("/shelters", methods=["POST"])
def add_shelter():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        name = (data.get("name") or "").strip()
        city = (data.get("city") or "").strip()
        address = (data.get("address") or "").strip()
        contact = (data.get("contact") or "").strip()

        if not name:
            return jsonify({"error": "Name is required"}), 400
        if not city:
            return jsonify({"error": "City is required"}), 400
        if not address:
            return jsonify({"error": "Address is required"}), 400
        if not contact:
            return jsonify({"error": "Contact is required"}), 400

        shelter = Shelter(
            name=name,
            city=city,
            address=address,
            latitude=parse_required_float(data.get("latitude"), "latitude"),
            longitude=parse_required_float(data.get("longitude"), "longitude"),
            capacity=parse_required_int(data.get("capacity"), "capacity"),
            occupied=parse_optional_int(data.get("occupied"), default=0),
            contact=contact,
            facilities=json.dumps(normalize_facilities(data.get("facilities"))),
            status=(data.get("status") or "active").strip() or "active",
        )

        db.session.add(shelter)
        db.session.commit()

        return jsonify({
            "message": "Shelter added successfully",
            "shelter": serialize_shelter(shelter),
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add shelter: {str(e)}"}), 500


@shelters_bp.route("/shelters/<int:id>", methods=["PATCH"])
def update_shelter(id):
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        shelter = Shelter.query.get(id)
        if not shelter:
            return jsonify({"error": "Shelter not found"}), 404

        if "name" in data:
            name = (data.get("name") or "").strip()
            if not name:
                return jsonify({"error": "Name cannot be empty"}), 400
            shelter.name = name

        if "city" in data:
            city = (data.get("city") or "").strip()
            if not city:
                return jsonify({"error": "City cannot be empty"}), 400
            shelter.city = city

        if "address" in data:
            address = (data.get("address") or "").strip()
            if not address:
                return jsonify({"error": "Address cannot be empty"}), 400
            shelter.address = address

        if "contact" in data:
            contact = (data.get("contact") or "").strip()
            if not contact:
                return jsonify({"error": "Contact cannot be empty"}), 400
            shelter.contact = contact

        if "latitude" in data:
            shelter.latitude = parse_required_float(data.get("latitude"), "latitude")

        if "longitude" in data:
            shelter.longitude = parse_required_float(data.get("longitude"), "longitude")

        if "capacity" in data:
            shelter.capacity = parse_required_int(data.get("capacity"), "capacity")

        if "occupied" in data:
            shelter.occupied = parse_optional_int(data.get("occupied"), default=0)

        if shelter.capacity is not None and shelter.capacity < 1:
            return jsonify({"error": "Capacity must be at least 1"}), 400

        if shelter.occupied is not None and shelter.occupied < 0:
            return jsonify({"error": "Occupied count cannot be negative"}), 400

        if shelter.capacity is not None and shelter.occupied is not None and shelter.occupied > shelter.capacity:
            return jsonify({"error": "Occupied count cannot exceed capacity"}), 400

        if "facilities" in data:
            shelter.facilities = json.dumps(normalize_facilities(data.get("facilities")))

        if "status" in data:
            shelter.status = (data.get("status") or "active").strip() or "active"

        db.session.commit()

        return jsonify({
            "message": "Shelter updated successfully",
            "shelter": serialize_shelter(shelter),
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update shelter: {str(e)}"}), 500
