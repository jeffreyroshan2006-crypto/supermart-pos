# ReadyBasket POS - Deployment Guide

## System Overview

ReadyBasket POS is a world-class retail billing system built with:
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: Passport.js with session-based authentication
- **Deployment**: Vercel (frontend) + Supabase (database)

## Prerequisites

1. **Node.js** 18+ installed locally
2. **Git** for version control
3. **Supabase** account (free tier works)
4. **Vercel** account (free tier works)

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/jeffreyroshan2006-crypto/Retail-BillFlow.git
cd Retail-BillFlow
npm install
```

### 2. Database Setup

#### Option A: Supabase (Recommended for Production)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings** > **Database** > **Connection String**
3. Copy the **URI** connection string
4. Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SESSION_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=development
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally (Mac)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb readybasket

# Update .env
DATABASE_URL=postgresql://localhost:5432/readybasket
SESSION_SECRET=your-super-secret-key-change-this-in-production
```

### 3. Run Database Migrations

```bash
# Push the schema to your database
npm run db:push

# Or if using Drizzle Kit directly
npx drizzle-kit push
```

### 4. Seed Initial Data

```bash
npm run db:seed
```

This creates:
- Default organization
- Primary store
- Admin user (admin / admin123)
- Default categories, units, and sample products

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Production Deployment

### Deploying to Vercel

#### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

#### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 3. Environment Variables

Add these environment variables in Vercel dashboard (**Settings** > **Environment Variables**):

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SESSION_SECRET=your-super-secret-production-key-min-32-characters-long
NODE_ENV=production
```

#### 4. Deploy

Click **Deploy** and wait for the build to complete.

### Supabase Production Configuration

#### 1. Enable Row Level Security (RLS)

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create policies (customize as needed)
CREATE POLICY org_isolation ON organizations
  FOR ALL USING (id = current_setting('app.current_org_id')::INTEGER);
```

#### 2. Configure Connection Pooling (Recommended)

In Supabase Dashboard:
1. Go to **Database** > **Connection Pooling**
2. Enable **PgBouncer**
3. Update your `DATABASE_URL` to use the pooler URL for serverless environments

#### 3. Set up Backups

Supabase provides automatic daily backups. For additional safety:
1. Go to **Database** > **Backups**
2. Enable **Point-in-Time Recovery** (paid feature)
3. Schedule regular exports

## Multi-Store Setup

To add additional stores to your organization:

1. Log in as admin
2. Go to **Settings** > **Stores**
3. Click **Add Store**
4. Fill in store details
5. Assign users to the new store

Each store has:
- Independent inventory
- Separate billing counters
- Individual settings
- Isolated reports

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features |
| **Manager** | Products, customers, purchases, reports, settings (no user management) |
| **Cashier** | POS only, view products and customers |

To create users:
1. Log in as admin
2. Go to **Settings** > **Users**
3. Click **Add User**
4. Assign role and stores

## GST Configuration (India)

### Default GST Rates

ReadyBasket supports standard Indian GST rates:
- 0% - Essential goods
- 5% - Basic necessities
- 12% - Standard goods
- 18% - Standard services
- 28% - Luxury goods

### Setting up GST

1. Go to **Settings** > **Tax Configuration**
2. Set default GST rate for your store
3. Configure HSN codes for products
4. Enable GST-inclusive pricing if applicable

### GST Reports

Access GST filing reports:
1. Go to **Reports** > **GST Summary**
2. Select date range
3. Export as CSV or print

## Backup and Disaster Recovery

### Automated Backups

Supabase provides:
- Daily automated backups (retained for 7 days on free tier)
- Point-in-time recovery (paid feature)

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Import database
psql $DATABASE_URL < backup_20240101.sql
```

### Data Export

Regularly export critical data:
1. **Products**: Settings > Data Export > Products
2. **Sales**: Reports > Sales > Export CSV
3. **Customers**: Customers > Export

## Security Best Practices

### 1. Session Security

- Change `SESSION_SECRET` regularly
- Use strong, unique secrets (32+ characters)
- Enable HTTPS in production
- Set secure cookie flags

### 2. Database Security

- Use connection pooling
- Enable RLS policies
- Regular security updates
- Monitor query logs

### 3. Access Control

- Use strong passwords
- Enable 2FA on Supabase/Vercel
- Regular access audits
- Remove inactive users

## Performance Optimization

### 1. Database Indexes

The schema includes optimized indexes. For large datasets:

```sql
-- Add additional indexes if needed
CREATE INDEX CONCURRENTLY idx_bills_date_store ON bills(bill_date, store_id);
CREATE INDEX CONCURRENTLY idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || sku));
```

### 2. Caching

Enable query caching:

```typescript
// In your API routes
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### 3. Image Optimization

For product images:
- Use WebP format
- Implement lazy loading
- Use CDN for static assets

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```
Error: Connection terminated unexpectedly
```

**Solution**: Enable connection pooling in Supabase and update DATABASE_URL

#### 2. Session Issues

Users logged out frequently:

**Solution**: Check SESSION_SECRET is set and consistent

#### 3. Build Failures

```
Error: Cannot find module
```

**Solution**: Run `npm install` and ensure all dependencies are in package.json

#### 4. Barcode Scanner Not Working

**Solution**: Ensure barcode scanner is in HID mode (acts as keyboard)

### Getting Help

1. Check application logs in Vercel dashboard
2. Review Supabase logs in Database > Logs
3. Enable debug mode: `DEBUG=* npm run dev`

## Updating the Application

### Minor Updates

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Run migrations if needed
npm run db:push

# Rebuild and redeploy
git push origin main
```

### Major Updates

1. Create a backup of your database
2. Test updates in a staging environment
3. Follow migration guides
4. Deploy during low-traffic hours

## Monitoring

### Key Metrics to Monitor

1. **Daily Sales Revenue**
2. **Number of Bills**
3. **Average Order Value**
4. **Stock Levels**
5. **System Uptime**

### Setup Alerts

In Supabase:
1. Go to **Database** > **Hooks**
2. Set up webhooks for low stock alerts
3. Configure email notifications

## Mobile/Tablet Setup

ReadyBasket is responsive and works on tablets:

1. Use iPad or Android tablet (10"+ recommended)
2. Connect barcode scanner via Bluetooth or USB
3. Use thermal printer (80mm) for receipts
4. Mount on POS stand for convenience

### Recommended Hardware

- **Tablet**: iPad 10th Gen / Samsung Galaxy Tab S9
- **Barcode Scanner**: Honeywell Voyager 1250g
- **Receipt Printer**: Epson TM-T82III
- **Cash Drawer**: Approx $50-100

## API Documentation

### Authentication

All API requests (except login) require authentication via session cookie.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/me` | GET | Get current user |
| `/api/products` | GET | List products |
| `/api/products` | POST | Create product |
| `/api/bills` | GET | List bills |
| `/api/bills` | POST | Create bill |
| `/api/bills/hold` | POST | Hold bill |
| `/api/reports/sales-summary` | GET | Sales report |

Full API documentation available at `/api/docs` (when implemented).

## License

MIT License - See LICENSE file for details.

## Support

For support and feature requests:
- GitHub Issues: [Create an issue](https://github.com/jeffreyroshan2006-crypto/Retail-BillFlow/issues)
- Email: support@readybasket.pos

---

**ReadyBasket POS** - Making retail billing simple and beautiful.
