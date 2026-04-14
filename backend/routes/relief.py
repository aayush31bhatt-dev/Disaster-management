import json

from flask import Blueprint, request, jsonify
from models import db, Relief

relief_bp = Blueprint("relief", __name__)


def parse_required_float(value, field_name):
    if value in (None, ""):
        raise ValueError(f"{field_name} is required")

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


def normalize_list(raw_value):
    if not raw_value:
        return []

    if isinstance(raw_value, list):
        return [str(item).strip() for item in raw_value if str(item).strip()]

    if isinstance(raw_value, str):
        try:
            decoded = json.loads(raw_value)
            if isinstance(decoded, list):
                return [str(item).strip() for item in decoded if str(item).strip()]
        except json.JSONDecodeError:
            return [item.strip() for item in raw_value.split(",") if item.strip()]

    return []


def serialize_relief(relief):
    supplies = normalize_list(relief.supplies)

    return {
        "id": relief.id,
        "title": relief.title,
        "description": relief.description,
        "name": relief.name or relief.title,
        "type": relief.type or "Aid Station",
        "city": relief.city or "",
        "address": relief.address or relief.description or "",
        "contact": relief.contact or "",
        "latitude": relief.latitude,
        "longitude": relief.longitude,
        "supplies": supplies,
        "status": relief.status or "operational",
        "posted_by": relief.posted_by,
        "created_at": relief.created_at.isoformat() if relief.created_at else None,
        "updated_at": relief.updated_at.isoformat() if relief.updated_at else None,
    }

@relief_bp.route("/relief", methods=["GET"])
def get_relief():
    reliefs = Relief.query.order_by(Relief.id.desc()).all()
    return jsonify([serialize_relief(r) for r in reliefs])

@relief_bp.route("/relief", methods=["POST"])
def add_relief():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        name = (data.get("name") or data.get("title") or "").strip()
        center_type = (data.get("type") or "").strip()
        city = (data.get("city") or "").strip()
        address = (data.get("address") or "").strip()
        contact = (data.get("contact") or "").strip()
        supplies = normalize_list(data.get("supplies"))

        if not name:
            return jsonify({"error": "Name is required"}), 400
        if not center_type:
            return jsonify({"error": "Type is required"}), 400
        if not city:
            return jsonify({"error": "City is required"}), 400
        if not address:
            return jsonify({"error": "Address is required"}), 400
        if not contact:
            return jsonify({"error": "Contact is required"}), 400
        if not supplies:
            return jsonify({"error": "At least one supply is required"}), 400

        relief = Relief(
            title=(data.get("title") or name).strip(),
            description=(data.get("description") or f"{center_type} serving {city}").strip(),
            name=name,
            type=center_type,
            city=city,
            address=address,
            contact=contact,
            latitude=parse_required_float(data.get("latitude"), "latitude"),
            longitude=parse_required_float(data.get("longitude"), "longitude"),
            supplies=json.dumps(supplies),
            status=(data.get("status") or "operational").strip() or "operational",
            posted_by=parse_optional_int(data.get("posted_by")),
        )

        db.session.add(relief)
        db.session.commit()

        return jsonify({
            "message": "Relief update posted successfully",
            "relief": serialize_relief(relief),
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add relief center: {str(e)}"}), 500


@relief_bp.route("/relief/<int:id>", methods=["PATCH"])
def update_relief(id):
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        relief = Relief.query.get(id)
        if not relief:
            return jsonify({"error": "Relief center not found"}), 404

        if "name" in data:
            name = (data.get("name") or "").strip()
            if not name:
                return jsonify({"error": "Name cannot be empty"}), 400
            relief.name = name
            relief.title = name

        if "type" in data:
            center_type = (data.get("type") or "").strip()
            if not center_type:
                return jsonify({"error": "Type cannot be empty"}), 400
            relief.type = center_type

        if "city" in data:
            city = (data.get("city") or "").strip()
            if not city:
                return jsonify({"error": "City cannot be empty"}), 400
            relief.city = city

        if "address" in data:
            address = (data.get("address") or "").strip()
            if not address:
                return jsonify({"error": "Address cannot be empty"}), 400
            relief.address = address

        if "contact" in data:
            contact = (data.get("contact") or "").strip()
            if not contact:
                return jsonify({"error": "Contact cannot be empty"}), 400
            relief.contact = contact

        if "latitude" in data:
            relief.latitude = parse_required_float(data.get("latitude"), "latitude")

        if "longitude" in data:
            relief.longitude = parse_required_float(data.get("longitude"), "longitude")

        if "supplies" in data:
            supplies = normalize_list(data.get("supplies"))
            if not supplies:
                return jsonify({"error": "At least one supply is required"}), 400
            relief.supplies = json.dumps(supplies)

        if "status" in data:
            relief.status = (data.get("status") or "operational").strip() or "operational"

        if "posted_by" in data:
            relief.posted_by = parse_optional_int(data.get("posted_by"))

        if "description" in data:
            description = (data.get("description") or "").strip()
            if not description:
                return jsonify({"error": "Description cannot be empty"}), 400
            relief.description = description
        elif any(key in data for key in ("type", "city")) and relief.type and relief.city:
            relief.description = f"{relief.type} serving {relief.city}"

        db.session.commit()

        return jsonify({
            "message": "Relief center updated successfully",
            "relief": serialize_relief(relief),
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update relief center: {str(e)}"}), 500
