#!/bin/bash

# StockSense Frontend Configuration Verification Script

echo "🔍 StockSense Frontend Configuration Checker"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Please run this script from the frontend root directory"
    exit 1
fi

echo "✅ Found package.json"

# Check vite.config.js
echo ""
echo "Checking vite.config.js..."
if grep -q "localhost:5001" vite.config.js; then
    echo "✅ vite.config.js configured for port 5001"
else
    echo "❌ vite.config.js NOT configured for port 5001"
    echo "   Expected: target: 'http://localhost:5001'"
fi

# Check axiosInstance.js
echo ""
echo "Checking src/api/axiosInstance.js..."
if grep -q "localhost:5001" src/api/axiosInstance.js; then
    echo "✅ axiosInstance.js configured for port 5001"
else
    echo "❌ axiosInstance.js NOT configured for port 5001"
    echo "   Expected: baseURL: 'http://localhost:5001'"
fi

# Check .env.example
echo ""
echo "Checking .env.example..."
if [ -f ".env.example" ]; then
    if grep -q "5001" .env.example; then
        echo "✅ .env.example configured for port 5001"
    else
        echo "⚠️  .env.example exists but port 5001 not configured"
    fi
else
    echo "⚠️  .env.example not found (optional)"
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules found - dependencies installed"
else
    echo "⚠️  node_modules not found - run: npm install"
fi

# Check if backend is running
echo ""
echo "Checking backend connection..."
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 5001"
else
    echo "⚠️  Backend not accessible on port 5001"
    echo "   Make sure your StockSense backend is running"
    echo "   Run: npm run dev (in backend directory)"
fi

# Summary
echo ""
echo "============================================="
echo "Configuration Summary:"
echo "  Backend URL: http://localhost:5001"
echo "  Frontend URL: http://localhost:3000 (when running)"
echo ""
echo "To start frontend:"
echo "  npm install  (if not done)"
echo "  npm run dev"
echo ""
echo "✅ Verification complete!"
