#!/bin/bash

echo "🚀 Starting Athena E-commerce Platform..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Start API server
echo "🔧 Starting API server..."
cd api
npm run dev &
API_PID=$!
echo "API PID: $API_PID"

# Wait for API to start
echo "⏳ Waiting for API to start..."
for i in {1..10}; do
    if check_port 3001; then
        echo "✅ API server started on port 3001"
        break
    fi
    echo "   Attempt $i/10..."
    sleep 2
done

# Test API
echo "🧪 Testing API..."
curl -s http://localhost:3001/api/products && echo "" || echo "❌ API health check failed"

# Start frontend server
echo "🎨 Starting frontend server..."
cd ..
node server.js &
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
echo "🎉 Athena E-commerce Platform is ready!"
echo "🛒 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "📦 Products API: http://localhost:3001/api/products"
echo "🏷️ Categories API: http://localhost:3001/api/categories"
echo ""
echo "💡 To stop the servers, run: pkill -f 'npm.*dev' && pkill -f 'node.*server.js'"
echo ""
echo "🎯 The application should now be accessible in your browser!"

# Keep script running
echo "Press Ctrl+C to stop all servers..."
wait
