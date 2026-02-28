@echo off
echo Starting ngrok tunnel...
echo.
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning:true"