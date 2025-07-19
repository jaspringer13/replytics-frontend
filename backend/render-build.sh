#!/bin/bash

# Render build script with pip upgrade

echo "Starting Render build process..."

# Upgrade pip to latest version
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install setuptools and wheel for better package building
echo "Installing build tools..."
python -m pip install --upgrade setuptools wheel

# Install requirements
echo "Installing dependencies..."
python -m pip install -r requirements.txt

echo "Build complete!"