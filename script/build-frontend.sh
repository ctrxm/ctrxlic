#!/bin/bash
npx vite build

echo "Building API serverless function..."
npx esbuild api/_handler.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=cjs \
  --outfile=api/index.js \
  --external:bcryptjs \
  --external:pg-native \
  --minify
