#!/bin/bash

echo "=============================="
echo "  EchoNet Phishing Simulator"
echo "=============================="
echo "Choose the fake page to serve:"
echo "1) Google Meet"
# echo "2) Zoom"
# echo "3) Microsoft Teams"
# echo "4) WhatsApp Web"
# echo "5) Instagram"
read -p "Enter choice [1-5]: " choice

# Set page based on user choice
case $choice in
  1) page="google-meet" ;;
  2) page="zoom" ;;
  3) page="teams" ;;
  4) page="whatsapp" ;;
  5) page="instagram" ;;
  *) echo "Invalid choice. Exiting." && exit 1 ;;
esac

echo "[+] Selected: $page"
export VITE_ACTIVE_PAGE=$page

# Build the React frontend
echo "[*] Building React app..."
cd frontend || { echo "frontend folder not found"; exit 1; }
npm install > /dev/null
npm run build || { echo "React build failed"; exit 1; }

# Move dist to Flask static folder
echo "[*] Updating Flask static files..."
rm -rf ../backend/static/*
cp -r dist/* ../backend/static/

# Go to backend and start Flask
cd ../backend || { echo "backend folder not found"; exit 1; }

echo "[*] Starting Flask server at http://localhost:5000"
source venv/bin/activate
export FLASK_APP=main.py
export FLASK_ENV=development
flask run
