#!/bin/bash

echo "🚀 Starting Athena Blog Platform..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Start backend server
echo "🔧 Starting backend server..."
cd backend
PORT=3003 npx tsx src/index.ts &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..10}; do
    if check_port 3003; then
        echo "✅ Backend server started on port 3003"
        break
    fi
    echo "   Attempt $i/10..."
    sleep 2
done

# Test backend
echo "🧪 Testing backend API..."
curl -s http://localhost:3003/api/health && echo "" || echo "❌ Backend health check failed"

# Start frontend server
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..10}; do
    if check_port 3000; then
        echo "✅ Frontend server started on port 3000"
        break
    fi
    echo "   Attempt $i/10..."
    sleep 2
done

echo ""
echo "🎉 Athena is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3003"
echo "🔍 API Health: http://localhost:3003/api/health"
echo "📊 API Posts: http://localhost:3003/api/posts"
echo ""
echo "💡 To stop the servers, run: pkill -f 'npm.*dev' && pkill -f tsx"
echo ""
echo "🎯 The application should now be accessible in your browser!"

# Keep script running
echo "Press Ctrl+C to stop all servers..."
wait
