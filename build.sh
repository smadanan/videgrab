#!/bin/bash
set -e

echo "📦 Installing yt-dlp..."
pip install yt-dlp

echo "📦 Installing dependencies..."
npm install

echo "⚛️  Building React frontend..."
npm run build

echo "✅ Build complete!"
