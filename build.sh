#!/bin/bash
set -e

echo "📦 Installing yt-dlp..."
pip install -U yt-dlp
echo "yt-dlp path: $(which yt-dlp)"
yt-dlp --version

echo "📦 Installing dependencies..."
npm install

echo "⚛️  Building React frontend..."
npm run build

echo "✅ Build complete!"
