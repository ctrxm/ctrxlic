# CTRXL LICENSE - Software License Management Platform

## Overview
CTRXL LICENSE is a full-featured software license management platform that allows developers to generate, validate, and track software licenses through a REST API. It includes a dashboard for managing products, licenses, API keys, and viewing statistics. Supports domain binding to restrict licenses to specific domains.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Dual auth - Replit Auth (OpenID Connect) + Email/Password (bcrypt)

## Project Structure
```
client/src/
  pages/         - All page components (landing, auth, dashboard, products, licenses, api-keys, statistics, docs, downloads, admin-*, install)
  components/    - Reusable components (app-sidebar, stat-card, theme-provider, theme-toggle)
  hooks/         - Custom hooks (use-auth, use-toast)
  lib/           - Utility functions (queryClient, utils, auth-utils)

server/
  index.ts       - Express app setup
  routes.ts      - All API routes + public license validation API + email/password auth + admin routes
  storage.ts     - Database storage layer (DatabaseStorage)
  db.ts          - Database connection
  replit_integrations/auth/ - Replit Auth module

shared/
  schema.ts      - Drizzle schema definitions (products, licenses, activations, apiKeys, auditLogs)
  models/auth.ts - Auth schema (users with passwordHash, role, sessions)
```

## Key Features
- Product management (CRUD)
- License generation with CL-XXX-XXX-XXX-XXX format (3-char segments)
- API key management with cl_ prefix
- Domain binding - restrict licenses to specific domains
- License validation REST API (POST /api/v1/licenses/validate) with domain validation
- Public license info endpoint (GET /api/v1/licenses/info/:key)
- Public installation page at /install/:key for license buyers
- License activation/deactivation API
- Statistics dashboard with charts
- API documentation with PHP, Next.js, Python, and cURL examples
- SDK download page - downloadable PHP, Next.js/TypeScript, Python SDK files
- Role-based admin panel (only visible to users with role="admin")
  - Admin Overview with system-wide stats
  - User management (promote/demote admin, delete users)
  - All licenses view (across all users)
  - Audit logs viewer
  - Platform settings
- Dual authentication: Replit Auth (OIDC) + email/password signup/login
- Responsive landing page with mobile hamburger menu

## Database Schema
- `users` - Auth users with optional passwordHash, role (default "user", can be "admin")
- `sessions` - Auth sessions
- `products` - Software products
- `licenses` - License keys with type, status, activations, allowedDomains (text array)
- `activations` - Machine activations per license
- `api_keys` - API keys for external validation (cl_ prefix)
- `audit_logs` - Action audit trail

## Admin System
- Users have a `role` column: "user" (default) or "admin"
- Admin sidebar section only visible to users with role="admin"
- Backend admin routes protected by `isAdmin` middleware
- Admin routes: GET /api/admin/stats, GET /api/admin/users, PATCH /api/admin/users/:id/role, DELETE /api/admin/users/:id, GET /api/admin/audit-logs, GET /api/admin/licenses, GET /api/admin/products
- Frontend admin pages redirect non-admin users to /dashboard

## Public Routes (no auth required)
- `/` - Landing page
- `/auth` - Login/Signup page (email/password)
- `/install/:key` - License installation guide for buyers
- `GET /api/v1/licenses/info/:key` - Public license info
- `POST /api/v1/licenses/validate` - License validation (requires API key header)
- `POST /api/v1/licenses/activate` - License activation (requires API key header)
- `POST /api/v1/licenses/deactivate` - License deactivation (requires API key header)

## Running
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database

## Design
- Dark/light mode with Inter font family
- Corporate modern design with blue primary color
- Sidebar navigation with colored icons per menu item (Shadcn sidebar)
- Dashboard with gradient hero banner, colored stat cards, quick action cards, and overview summary
- CSS animations: fade-in, fade-in-scale, slide-in-left with stagger delays for smooth page loads
- Brand: CTRXL LICENSE

## User Preferences
- License format: CL-XXX-XXX-XXX-XXX (4 segments of 3 uppercase alphanumeric chars)
- API key prefix: cl_
- Brand name: CTRXL LICENSE
- Domain binding feature for license validation
- Unified dashboard with admin features only for admin-role users
