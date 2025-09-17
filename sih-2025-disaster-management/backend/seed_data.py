from app import app, db
from models import User, Shelter, Incident, Relief, SOS
from werkzeug.security import generate_password_hash

# Run this script once to insert sample data
with app.app_context():
    # Clear old data
    db.drop_all()
    db.create_all()

    # Users
    admin = User(
        name="Admin One",
        email="admin@example.com",
        password_hash=generate_password_hash("admin123"),
        role="admin"
    )
    john = User(
        name="John Doe",
        email="john@example.com",
        password_hash=generate_password_hash("john123"),
        role="user"
    )
    jane = User(
        name="Jane Smith",
        email="jane@example.com",
        password_hash=generate_password_hash("jane123"),
        role="user"
    )
    db.session.add_all([admin, john, jane])
    db.session.commit()

    # Shelters
    shelters = [
        Shelter(name="Community Hall A", latitude=28.7041, longitude=77.1025, capacity=200, contact="9876543210"),
        Shelter(name="School Building B", latitude=19.0760, longitude=72.8777, capacity=150, contact="9123456780"),
        Shelter(name="Town Hall C", latitude=13.0827, longitude=80.2707, capacity=300, contact="9988776655")
    ]
    db.session.add_all(shelters)
    db.session.commit()

    # Incidents
    incidents = [
        Incident(user_id=john.id, title="Flooded Area", description="Severe waterlogging reported",
                 latitude=28.5355, longitude=77.3910, status="reported"),
        Incident(user_id=jane.id, title="Building Collapse", description="Collapsed building near market",
                 latitude=19.2183, longitude=72.9781, status="verified")
    ]
    db.session.add_all(incidents)
    db.session.commit()

    # Relief
    reliefs = [
        Relief(title="Food Distribution Camp", description="Free food available at Community Hall A",
               latitude=28.7041, longitude=77.1025, posted_by=admin.id),
        Relief(title="Medical Aid", description="Doctors providing aid at School Building B",
               latitude=19.0760, longitude=72.8777, posted_by=admin.id)
    ]
    db.session.add_all(reliefs)
    db.session.commit()

    # SOS
    sos_entries = [
        SOS(user_id=john.id, message="Trapped on rooftop, need urgent rescue!",
            latitude=28.4595, longitude=77.0266, status="new"),
        SOS(user_id=jane.id, message="Family stranded, need medical help",
            latitude=19.0760, longitude=72.8777, status="acknowledged")
    ]
    db.session.add_all(sos_entries)
    db.session.commit()

    print("✅ Sample data inserted successfully!")
