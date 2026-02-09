# CTRXL LICENSE - Deployment Guide

## Prerequisites

Before deploying to any platform, you need:

1. **PostgreSQL Database** - Use a cloud PostgreSQL service:
   - [Neon](https://neon.tech) (recommended, free tier available)
   - [Supabase](https://supabase.com)
   - [PlanetScale](https://planetscale.com)

2. **Environment Variables** (set on your deployment platform):
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Random secret string for sessions (generate with `openssl rand -hex 32`)
   - `NODE_ENV` - Set to `production`
   - `CORS_ORIGINS` - Comma-separated allowed origins (only needed for cross-origin setup)

3. **Push Database Schema** - After setting up your database:
   ```bash
   DATABASE_URL=your_connection_string npx drizzle-kit push
   ```

---

## Option 1: Deploy to Vercel (Full-Stack)

Vercel hosts both the frontend and API backend as serverless functions.

### Steps:

1. **Push your code to GitHub**

2. **Import project in Vercel**
   - Go to [vercel.com](https://vercel.com) and click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect `vercel.json`

3. **Set Environment Variables in Vercel Dashboard**
   - `DATABASE_URL` = your PostgreSQL connection string
   - `SESSION_SECRET` = a random secret string
   - `NODE_ENV` = `production`

4. **Deploy**
   - Click "Deploy" and Vercel will build and deploy automatically

5. **Push database schema**
   ```bash
   DATABASE_URL=your_connection_string npx drizzle-kit push
   ```

### How it works:
- Frontend is built as static files and served via Vercel CDN
- API routes (`/api/*`) are handled by the serverless function in `api/index.ts`
- The `vercel.json` configures routing between static files and API

### Custom Domain on Vercel:
- Go to your project Settings > Domains
- Add your custom domain
- Update DNS records as instructed by Vercel

---

## Option 2: Deploy to Cloudflare Pages (Frontend) + Vercel (API)

Since Express.js cannot run on Cloudflare Workers, this setup deploys:
- **Frontend** on Cloudflare Pages (fast global CDN)
- **Backend API** on Vercel (serverless Node.js)

### Step 1: Deploy API to Vercel

Follow the Vercel steps above. After deploying, note your Vercel API URL (e.g., `https://your-app.vercel.app`).

Add this additional environment variable to Vercel:
- `CORS_ORIGINS` = `https://your-cloudflare-domain.pages.dev` (your Cloudflare Pages URL)

### Step 2: Deploy Frontend to Cloudflare Pages

1. **Push your code to GitHub**

2. **Create a Cloudflare Pages project**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages
   - Click "Create a project" > "Connect to Git"
   - Select your GitHub repository

3. **Configure Build Settings**
   - Build command: `bash script/build-cloudflare.sh`
   - Build output directory: `dist/public`
   - Environment variable: `VITE_API_URL` = `https://your-app.vercel.app` (your Vercel URL)

4. **Deploy**
   - Click "Save and Deploy"

### Custom Domain on Cloudflare:
- Go to your Pages project > Custom domains
- Add your domain (works great if your domain is already on Cloudflare DNS)

---

## Option 3: Deploy to Vercel (Full-Stack with Custom Domain)

This is the simplest option - everything on Vercel with a custom domain.

1. Follow Option 1 steps
2. In Vercel Dashboard > Settings > Domains, add your custom domain
3. Point your domain's DNS to Vercel:
   - A Record: `76.76.21.21`
   - Or CNAME: `cname.vercel-dns.com`

---

## Authentication Notes

- **Email/Password login** works on all platforms
- **Replit Auth (OIDC)** only works when running on Replit - it will be disabled on external deployments
- When deploying externally, use email/password authentication

## Database Setup

1. Create a PostgreSQL database on Neon, Supabase, or another provider
2. Get the connection string (starts with `postgresql://...`)
3. Set it as `DATABASE_URL` environment variable
4. Run schema migration:
   ```bash
   DATABASE_URL=postgresql://... npx drizzle-kit push
   ```

## Troubleshooting

- **API returns 500**: Check that `DATABASE_URL` and `SESSION_SECRET` are set correctly
- **CORS errors**: Set `CORS_ORIGINS` to your frontend domain on the API server
- **Login not working**: Make sure `SESSION_SECRET` is set and cookies are configured for your domain
- **Frontend shows blank page**: Verify `VITE_API_URL` points to the correct API URL (only needed for cross-origin setup)
