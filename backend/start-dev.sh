#!/bin/bash

# Development startup script for Replytics Dashboard API

echo "Starting Replytics Dashboard API in development mode..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment (compatible with different shells)
. venv/bin/activate

# Verify activation worked
if [ -z "$VIRTUAL_ENV" ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi

# Install/update dependencies
echo "Installing dependencies..."
if ! pip install -r requirements.txt; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

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