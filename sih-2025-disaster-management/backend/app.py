from flask import Flask
from flask_cors import CORS
from models import db, User, Incident, Shelter, Relief, SOS
from routes.auth import auth_bp
from routes.incidents import incidents_bp
from routes.shelters import shelters_bp
from routes.relief import relief_bp
from routes.sos import sos_bp

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost:3306/disaster_management'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(incidents_bp, url_prefix="/api")
app.register_blueprint(shelters_bp, url_prefix="/api")
app.register_blueprint(relief_bp, url_prefix="/api")
app.register_blueprint(sos_bp, url_prefix="/api")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Creates tables if not exist
    app.run(host='127.0.0.1', port=5000, debug=True)
