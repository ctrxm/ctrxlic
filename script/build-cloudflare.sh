#!/bin/bash
npx vite build
cp cloudflare-pages/_redirects dist/public/_redirects
echo "Cloudflare Pages build complete. Output directory: dist/public"
