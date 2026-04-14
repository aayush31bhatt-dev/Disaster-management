import importlib.util
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None
from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import URL
from sqlalchemy.engine.url import make_url

from models import db, User, Incident, Shelter, Relief, SOS
from routes.auth import auth_bp
from routes.incidents import incidents_bp
from routes.shelters import shelters_bp
from routes.relief import relief_bp
from routes.sos import sos_bp
from sample_data import ensure_sample_data


def load_environment():
    if load_dotenv is not None:
        load_dotenv()
        return

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_environment()


def env_flag(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def build_sql_server_uri():
    if importlib.util.find_spec("pyodbc") is None:
        raise RuntimeError(
            "SQL Server configuration detected, but 'pyodbc' is not installed. "
            "Install pyodbc and a Microsoft ODBC SQL Server driver before starting the backend."
        )

    host = os.getenv("SQLSERVER_HOST", "localhost")
    port = int(os.getenv("SQLSERVER_PORT", "1433"))
    database = os.getenv("SQLSERVER_DATABASE", "disaster_management_new_db")
    username = os.getenv("SQLSERVER_USER")
    password = os.getenv("SQLSERVER_PASSWORD")
    driver = os.getenv("SQLSERVER_DRIVER", "ODBC Driver 18 for SQL Server")
    encrypt = os.getenv("SQLSERVER_ENCRYPT", "no")
    trust_server_certificate = os.getenv("SQLSERVER_TRUST_SERVER_CERTIFICATE", "yes")

    query = {
        "driver": driver,
        "Encrypt": encrypt,
        "TrustServerCertificate": trust_server_certificate,
    }

    if username and password:
        url = URL.create(
            "mssql+pyodbc",
            username=username,
            password=password,
            host=host,
            port=port,
            database=database,
            query=query,
        )
    else:
        query["trusted_connection"] = "yes"
        url = URL.create(
            "mssql+pyodbc",
            host=host,
            port=port,
            database=database,
            query=query,
        )

    return url.render_as_string(hide_password=False)


def build_sqlite_uri():
    sqlite_path = os.getenv("SQLITE_DATABASE_PATH")
    if sqlite_path:
        db_path = Path(sqlite_path).expanduser()
        if not db_path.is_absolute():
            db_path = Path(__file__).resolve().parent.parent / db_path
    else:
        db_path = Path(__file__).resolve().parent.parent / "database" / "disaster_management.db"

    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path.resolve().as_posix()}"


def build_database_uri():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("mssql+") and importlib.util.find_spec("pyodbc") is None:
            raise RuntimeError(
                "DATABASE_URL points to SQL Server, but 'pyodbc' is not installed. "
                "Install pyodbc and a Microsoft ODBC SQL Server driver before starting the backend."
            )
        return database_url

    db_backend = os.getenv("DB_BACKEND", "sqlite").strip().lower()
    if db_backend == "sqlite":
        return build_sqlite_uri()
    if db_backend in {"sqlserver", "mssql"}:
        return build_sql_server_uri()

    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_database = os.getenv("MYSQL_DATABASE", "disaster_management_new_db")
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "")

    return os.getenv(
        "MYSQL_DATABASE_URL",
        f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}",
    )


def ensure_database_exists(database_uri):
    url = make_url(database_uri)

    if not url.drivername.startswith("mysql"):
        return

    database_name = url.database
    if not database_name:
        return

    server_url = url.set(database=None)
    server_engine = create_engine(server_url.render_as_string(hide_password=False), pool_pre_ping=True)

    with server_engine.begin() as connection:
        connection.execute(text(f"CREATE DATABASE IF NOT EXISTS `{database_name}`"))

    server_engine.dispose()


app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = build_database_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
}
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(incidents_bp, url_prefix="/api")
app.register_blueprint(shelters_bp, url_prefix="/api")
app.register_blueprint(relief_bp, url_prefix="/api")
app.register_blueprint(sos_bp, url_prefix="/api")


def ensure_schema():
    db.create_all()

    table_updates = {
        "incidents": {
            "city": "ALTER TABLE incidents ADD COLUMN city VARCHAR(100) NULL",
            "priority": "ALTER TABLE incidents ADD COLUMN priority VARCHAR(20) NULL DEFAULT 'medium'",
            "updated_at": "ALTER TABLE incidents ADD COLUMN updated_at DATETIME NULL",
        },
        "shelters": {
            "city": "ALTER TABLE shelters ADD COLUMN city VARCHAR(100) NULL",
            "address": "ALTER TABLE shelters ADD COLUMN address VARCHAR(255) NULL",
            "occupied": "ALTER TABLE shelters ADD COLUMN occupied INT NOT NULL DEFAULT 0",
            "facilities": "ALTER TABLE shelters ADD COLUMN facilities TEXT NULL",
            "status": "ALTER TABLE shelters ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'",
            "created_at": "ALTER TABLE shelters ADD COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "ALTER TABLE shelters ADD COLUMN updated_at DATETIME NULL",
        },
        "relief": {
            "name": "ALTER TABLE relief ADD COLUMN name VARCHAR(100) NULL",
            "type": "ALTER TABLE relief ADD COLUMN type VARCHAR(50) NULL",
            "city": "ALTER TABLE relief ADD COLUMN city VARCHAR(100) NULL",
            "address": "ALTER TABLE relief ADD COLUMN address VARCHAR(255) NULL",
            "contact": "ALTER TABLE relief ADD COLUMN contact VARCHAR(100) NULL",
            "supplies": "ALTER TABLE relief ADD COLUMN supplies TEXT NULL",
            "status": "ALTER TABLE relief ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'operational'",
            "updated_at": "ALTER TABLE relief ADD COLUMN updated_at DATETIME NULL",
        },
        "sos": {
            "phone": "ALTER TABLE sos ADD COLUMN phone VARCHAR(30) NULL",
            "city": "ALTER TABLE sos ADD COLUMN city VARCHAR(100) NULL",
            "priority": "ALTER TABLE sos ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'medium'",
            "updated_at": "ALTER TABLE sos ADD COLUMN updated_at DATETIME NULL",
        },
    }

    with db.engine.begin() as connection:
        inspector = inspect(connection)

        for table_name, updates in table_updates.items():
            if not inspector.has_table(table_name):
                continue

            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, sql in updates.items():
                if column_name not in existing_columns:
                    connection.execute(text(sql))


def initialize_database():
    database_uri = app.config["SQLALCHEMY_DATABASE_URI"]
    ensure_database_exists(database_uri)

    with app.app_context():
        ensure_schema()
        if env_flag("SEED_SAMPLE_DATA", default=True):
            ensure_sample_data()


initialize_database()

if __name__ == "__main__":
    app.run(
        host=os.getenv('APP_HOST', '127.0.0.1'),
        port=int(os.getenv('APP_PORT', '5000')),
        debug=env_flag('DEBUG', default=True),
    )
