#!/bin/bash
# Railway start script - runs both backend and frontend

# Install dependencies
npm install

# Build frontend
cd frontend || npm run build

# Start backend (which will serve frontend as static files)
cd ../server
node server.cjs
