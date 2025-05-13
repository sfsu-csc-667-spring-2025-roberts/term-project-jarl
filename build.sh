#!/bin/bash
# build.sh - Complete build script for the poker game

echo "🚀 Building Full Stack Poker Game..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install socket.io-client@4.5.4 @types/socket.io-client@2.0.2 --save

# Create directories if they don't exist
mkdir -p src/public/client/types
mkdir -p public/js

# Copy all the fixed files
echo "📁 Copying fixed files..."

# Client side
cp client-socket-final.js src/public/client/socket/index.ts
cp lobby-client-final.js src/public/client/js/lobby.ts
cp games-client-fixed.js src/public/client/js/games.ts
cp friends-client-fixed.js src/public/client/js/friends.ts

# Server side
cp server-socket-final.js src/server/socket/index.ts

# Build client code
echo "🔨 Building client code..."
npx webpack --config webpack.config.js

# Check for build errors
if [ $? -ne 0 ]; then
    echo "❌ Client build failed"
    exit 1
fi

echo "✅ Build successful!"
echo "🎮 Your poker game is ready to run!"
echo "   Run: npm start"