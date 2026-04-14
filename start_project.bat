@echo off
cls
echo ====================================
echo    ANHONI Disaster Management
echo       SIH 2025 Project
echo ====================================
echo.
echo Opening project in browser...
echo.

REM Open main page
start http://localhost/Disaster-management/sih-2025-disaster-management/frontend/index.html

REM Wait a moment then open admin dashboard
timeout /t 2 /nobreak >nul
start http://localhost/Disaster-management/sih-2025-disaster-management/frontend/admin_dashboard.html

echo.
echo ✅ Frontend is now running!
echo.
echo 📋 Available URLs:
echo ┌─────────────────────────────────────────────────────────────────────
echo │ Main Page:  http://localhost/Disaster-management/sih-2025-disaster-management/frontend/index.html
echo │ Admin:      http://localhost/Disaster-management/sih-2025-disaster-management/frontend/admin_dashboard.html
echo └─────────────────────────────────────────────────────────────────────
echo.
echo 🎮 What you can do right now:
echo ┌─────────────────────────────────────────────────────────────────────
echo │ ✅ Manage disaster awareness tips
echo │ ✅ Send emergency alerts (Flood, Earthquake, Fire)
echo │ ✅ Track incidents with status updates
echo │ ✅ Manage relief camps and resources
echo │ ✅ Upload damage assessment reports
echo └─────────────────────────────────────────────────────────────────────
echo.
echo 💡 Note: Make sure XAMPP Apache service is running
echo.
pause