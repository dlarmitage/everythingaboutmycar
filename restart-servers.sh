#!/bin/bash

echo "Killing existing server processes..."
# Kill API server
lsof -t -i:3005 | xargs kill -9 2>/dev/null || true
# Kill dev server
lsof -t -i:5173 | xargs kill -9 2>/dev/null || true

echo "Starting API server..."
# Start API server in the background
npm run api &
API_PID=$!

echo "Starting dev server..."
# Start dev server in the background
npm run dev &
DEV_PID=$!

echo "Servers started!"
echo "API server PID: $API_PID"
echo "Dev server PID: $DEV_PID"
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $API_PID $DEV_PID; exit" INT
wait
