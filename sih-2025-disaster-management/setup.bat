@echo off
echo ================================
echo ANHONI Disaster Management Setup
echo ================================

echo.
echo Step 1: Installing Python packages...
py -m pip install --upgrade pip
py -m pip install Flask
py -m pip install Flask-SQLAlchemy
py -m pip install Flask-CORS
py -m pip install PyMySQL
py -m pip install python-dotenv

echo.
echo Step 2: Creating environment file...
if not exist .env (
    echo FLASK_APP=app.py > .env
    echo FLASK_ENV=development >> .env
    echo DATABASE_URL=mysql+pymysql://root:@localhost/disaster_management>> .env
    echo SECRET_KEY=dev-secret-key-change-in-production >> .env
    echo DEBUG=True >> .env
    echo Environment file created successfully!
) else (
    echo Environment file already exists.
)

echo.
echo Setup completed!
echo.
echo To start the backend server:
echo 1. Make sure XAMPP Apache and MySQL are running
echo 2. Run: cd backend
echo 3. Run: py app.py
echo.
echo Frontend is available at:
echo http://localhost/Disaster-management/sih-2025-disaster-management/frontend/admin_dashboard.html
echo.
pause