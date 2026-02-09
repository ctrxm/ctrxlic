#!/bin/bash
npx vite build

echo "Building API serverless function..."
npx esbuild api/_handler.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  --outfile=api/index.js \
  --external:bcryptjs \
  --external:pg-native \
  --minify \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
