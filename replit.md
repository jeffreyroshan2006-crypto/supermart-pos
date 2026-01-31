# SuperMart POS - Retail Billing System

## Overview

SuperMart POS is a full-stack retail billing and point-of-sale system built for managing products, customers, bills, and inventory. The application provides a complete POS terminal for cashiers, inventory management for administrators, customer tracking with loyalty points, and sales analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Charts**: Recharts for dashboard analytics
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with tsx for development
- **API Design**: RESTful endpoints with typed request/response contracts
- **Session Management**: Express-session with PostgreSQL store (connect-pg-simple)
- **Authentication**: Passport.js with local strategy, password hashing via scrypt

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)
- **Core Tables**: users, products, customers, suppliers, bills, bill_items

### Authentication & Authorization
- Session-based authentication stored in PostgreSQL
- Role-based access control with three roles: admin, manager, cashier
- Protected routes require authentication via `requireAuth` middleware
- Passwords hashed with scrypt and random salt

### Build System
- **Development**: Vite dev server with HMR proxied through Express
- **Production Build**: 
  - Client: Vite builds to `dist/public`
  - Server: esbuild bundles to `dist/index.cjs`
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared/

### API Contract
The `shared/routes.ts` file defines a typed API contract with Zod schemas for:
- Input validation
- Response typing
- URL building utilities

This enables type-safe API calls between frontend and backend.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Framework
- **Radix UI**: Accessible, unstyled component primitives (accordion, dialog, dropdown, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization

### Date Handling
- **date-fns**: Date formatting and manipulation

### Validation
- **Zod**: Schema validation for forms and API contracts
- **drizzle-zod**: Generate Zod schemas from Drizzle table definitions

### Authentication
- **Passport.js**: Authentication middleware
- **passport-local**: Username/password authentication strategy
- **express-session**: Session middleware