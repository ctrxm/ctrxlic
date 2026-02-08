# LicenseGuard - Software License Management Platform

## Overview
LicenseGuard is a full-featured software license management platform that allows developers to generate, validate, and track software licenses through a REST API. It includes a dashboard for managing products, licenses, API keys, and viewing statistics.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)

## Project Structure
```
client/src/
  pages/         - All page components (landing, dashboard, products, licenses, api-keys, statistics, docs, admin)
  components/    - Reusable components (app-sidebar, stat-card, theme-provider, theme-toggle)
  hooks/         - Custom hooks (use-auth, use-toast)
  lib/           - Utility functions (queryClient, utils, auth-utils)

server/
  index.ts       - Express app setup
  routes.ts      - All API routes + public license validation API
  storage.ts     - Database storage layer (DatabaseStorage)
  db.ts          - Database connection
  replit_integrations/auth/ - Auth module

shared/
  schema.ts      - Drizzle schema definitions (products, licenses, activations, apiKeys, auditLogs)
  models/auth.ts - Auth schema (users, sessions)
```

## Key Features
- Product management (CRUD)
- License generation with customizable types (trial, standard, professional, enterprise)
- API key management for external integrations
- License validation REST API (POST /api/v1/licenses/validate)
- License activation/deactivation API
- Statistics dashboard with charts
- API documentation with PHP, Next.js, Python, and cURL examples
- Admin panel with user management

## Database Schema
- `users` - Auth users (managed by Replit Auth)
- `sessions` - Auth sessions
- `products` - Software products
- `licenses` - License keys with type, status, activations
- `activations` - Machine activations per license
- `api_keys` - API keys for external validation
- `audit_logs` - Action audit trail

## Running
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database

## Design
- Dark/light mode with Inter font family
- Corporate modern design with blue primary color
- Sidebar navigation for authenticated users
