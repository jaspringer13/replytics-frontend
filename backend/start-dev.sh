#!/bin/bash

# Development startup script for Replytics Dashboard API

echo "Starting Replytics Dashboard API in development mode..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Run the development server
echo "Starting server on http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
uvicorn main:app --reload --host 0.0.0.0 --port 8000