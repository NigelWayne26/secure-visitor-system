#!/bin/bash

# Secure Visitor and Access Control Management System
# Starts both the Django backend and React frontend dev servers.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "Starting Secure Visitor System..."

# --- Backend checks ---
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "Error: virtual environment not found at $BACKEND_DIR/venv"
    echo "Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "Error: $BACKEND_DIR/.env not found."
    echo "Copy backend/.env.example to backend/.env and fill in real values first."
    exit 1
fi

# --- Frontend checks ---
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Frontend dependencies not installed. Installing now..."
    (cd "$FRONTEND_DIR" && npm install)
fi

# --- Start backend ---
echo "Starting Django backend on http://127.0.0.1:8000 ..."
(
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python3 manage.py runserver
) &
BACKEND_PID=$!

# --- Start frontend ---
echo "Starting React frontend on http://localhost:5173 ..."
(
    cd "$FRONTEND_DIR"
    npm run dev
) &
FRONTEND_PID=$!

# --- Cleanup on exit ---
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    echo "Stopped."
}
trap cleanup EXIT INT TERM

echo ""
echo "Both servers are starting. Press Ctrl+C to stop both."
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://localhost:5173"
echo ""

wait
