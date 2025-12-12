#!/bin/bash
# Vaaya Server Startup Script

cd "$(dirname "$0")"

echo "Stopping any existing Flask servers..."
pkill -9 -f "python app.py" 2>/dev/null
sleep 2

echo "Starting Vaaya API Server..."
python app.py
