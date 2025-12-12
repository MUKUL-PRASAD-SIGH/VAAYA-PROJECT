@echo off
cls
echo ============================================================
echo VAAYA - AI-Powered Tourism Platform
echo ============================================================
echo.
echo Starting Flask server with Socket.IO...
echo.
echo Backend: http://localhost:5000
echo.
echo Available Pages:
echo   - Dashboard:  http://localhost:5000/dashboard
echo   - Quests:     http://localhost:5000/quests  
echo   - Trips:      http://localhost:5000/trips
echo   - Heatmap:    http://localhost:5000/heatmap (Interactive Map!)
echo   - Chat:       http://localhost:5000/chat (Real-time Chat!)
echo.
echo ============================================================
echo.

REM Set UTF-8 encoding
chcp 65001 > nul

REM Start the server
python app.py

pause
