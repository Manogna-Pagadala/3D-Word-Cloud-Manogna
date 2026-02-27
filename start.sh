#!/bin/bash

# 3D Word Cloud — Setup & Start Script (macOS)
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[setup]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

log "Starting 3D Word Cloud setup..."

# Check Python is installed
if ! command -v python3 &>/dev/null; then
  err "Python 3 not found. Install from https://python.org or via Homebrew: brew install python"
fi
ok "Python 3 found: $(python3 --version)"

# Check Node is installed
if ! command -v node &>/dev/null; then
  err "Node.js not found. Install from https://nodejs.org or via Homebrew: brew install node"
fi
ok "Node.js found: $(node --version)"

# Check npm is installed
if ! command -v npm &>/dev/null; then
  err "npm not found. It should come with Node.js."
fi
ok "npm found: $(npm --version)"

# Set up Python virtual environment and install backend dependencies
log "Setting up Python virtual environment..."
cd backend

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  ok "Virtual environment created"
fi

source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
ok "Backend dependencies installed"
deactivate
cd ..

# Install frontend dependencies
log "Installing frontend dependencies..."
cd frontend
npm install --silent
ok "Frontend dependencies installed"
cd ..

# Start both servers
echo ""
log "Launching servers..."
echo -e "  Backend  → http://localhost:8000"
echo -e "  Frontend → http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# Start backend
(
  cd backend
  source .venv/bin/activate
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

# Start frontend
(
  cd frontend
  npm run dev
) &
FRONTEND_PID=$!

# Stop both servers when Ctrl+C is pressed
cleanup() {
  echo ""
  log "Shutting down servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

wait $BACKEND_PID $FRONTEND_PID