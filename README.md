# ReadyBasket POS - World-Class Retail Billing System

<p align="center">
  <img src="./attached_assets/generated_images/modern_retail_pos_logo_for_supermart.png" alt="ReadyBasket Logo" width="120" />
</p>

<p align="center">
  <b>A modern, beautiful, and powerful Point of Sale system for retail businesses</b>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## ✨ Features

### Core POS Features
- **⚡ Lightning-fast billing** - Keyboard-friendly, barcode-ready, minimal clicks
- **🛒 Smart cart** - Real-time calculations, item-level discounts, tax handling
- **💳 Multiple payment modes** - Cash, UPI, Card, Wallet, Split payments
- **⏸️ Hold/Resume bills** - Handle multiple customers simultaneously
- **🎁 Discounts & Offers** - Percentage, fixed amount, Buy X Get Y
- **🏷️ Barcode scanning** - Works with any USB barcode scanner

### Inventory Management
- **📦 Product catalog** - SKU, barcode, categories, brands
- **📊 Stock tracking** - Real-time inventory with low-stock alerts
- **📝 Purchase orders** - Track orders from suppliers
- **🔧 Stock adjustments** - Damage, expiry, corrections
- **📈 Reorder points** - Never run out of stock

### Multi-Store Support
- **🏪 Multiple locations** - Manage multiple stores from one dashboard
- **👥 Role-based access** - Admin, Manager, Cashier roles
- **📍 Store switching** - Easy switch between stores
- **📊 Store-wise reports** - Compare performance across locations

### Indian Retail Ready
- **💰 GST compliant** - CGST, SGST, IGST calculations
- **🏷️ MRP support** - Maximum Retail Price display
- **📱 UPI payments** - Native QR code support
- **🧾 GST reports** - Monthly filing reports

### Customer Management
- **👤 Customer database** - Phone-based lookup
- **🎁 Loyalty program** - Points per purchase, redemption
- **📧 GST invoicing** - GSTIN support for B2B
- **📱 SMS/WhatsApp** - Share bills instantly

### Reporting & Analytics
- **📊 Sales dashboard** - Daily, weekly, monthly trends
- **🏆 Top products** - Best-selling items
- **📈 Category analysis** - Performance by category
- **💵 Payment summary** - Cash flow tracking
- **🧾 GST summaries** - Tax filing made easy

### Modern UI/UX
- **🎨 Glassmorphism design** - Beautiful frosted glass effects
- **🌓 Dark mode** - Easy on the eyes during long shifts
- **📱 Responsive** - Works on desktop and tablet
- **⌨️ Keyboard shortcuts** - Power user friendly
- **🔄 Offline support** - Cart syncs when back online

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/jeffreyroshan2006-crypto/Retail-BillFlow.git
cd Retail-BillFlow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

**Default login:**
- Username: `admin`
- Password: `admin123`

Visit `http://localhost:5000` to access the application.

---

## 🌐 Deployment

### ⚠️ Important: Cannot Use GitHub Pages

**GitHub Pages only supports static websites.** This app requires:
- Backend server (Express.js) ❌
- Database (PostgreSQL) ❌
- Environment variables ❌

**[Read more about GitHub Pages limitations](./GITHUB_PAGES_WARNING.md)**

### ✅ Recommended: Deploy to Vercel + Supabase

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy database connection string

2. **Set up environment variables**
   ```env
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-secret-key
   ```

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo: `jeffreyroshan2006-crypto/supermart-pos`
   - Add environment variables
   - Deploy!

📖 **[Complete Deployment Guide](./DEPLOYMENT.md)**

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI |
| **State Management** | TanStack Query (React Query) |
| **Backend** | Express.js, Node.js |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Auth** | Passport.js |
| **Validation** | Zod |

### Database Schema

The system uses a comprehensive multi-tenant schema:

- **Organizations** - Multi-tenant isolation
- **Stores** - Multiple locations per organization
- **Users** - Role-based authentication
- **Products** - Inventory with stock tracking
- **Customers** - CRM with loyalty
- **Bills** - Transactions with GST
- **Purchase Orders** - Supplier management
- **Stock Adjustments** - Inventory corrections

📊 **[View Complete Schema](./migrations/0001_readybasket_complete_schema.sql)**

### Folder Structure

```
Retail-BillFlow/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── pos/      # POS-specific components
│   │   │   └── ui/       # shadcn/ui components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities
├── server/               # Backend Express app
│   ├── routes/          # API routes
│   ├── storage/         # Database operations
│   └── auth.ts          # Authentication
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema + Zod types
└── migrations/          # SQL migrations
```

---

## 🎯 Key Features Explained

### Glassmorphism Design

The UI features modern glassmorphism with:
- Semi-transparent backgrounds
- Backdrop blur effects
- Gradient accents
- Smooth shadows
- Dark mode support

### Multi-Store Architecture

Each organization can have multiple stores:
```typescript
Organization
├── Store 1 (Main Branch)
│   ├── Products
│   ├── Bills
│   └── Customers
├── Store 2 (Branch 2)
│   ├── Products
│   ├── Bills
│   └── Customers
```

### GST Calculation (India)

Automatic GST calculation with:
```typescript
// CGST + SGST for intra-state
const cgst = taxableAmount * (gstRate / 2) / 100;
const sgst = taxableAmount * (gstRate / 2) / 100;

// IGST for inter-state
const igst = taxableAmount * gstRate / 100;
```

### Barcode Scanning

Works with any USB/HID barcode scanner:
- No special drivers needed
- Scanner acts as keyboard input
- Automatic product lookup
- Sound feedback on scan

---

## 🛣️ Roadmap

### Phase 1: Core POS ✅
- [x] Product management
- [x] Cart & checkout
- [x] Barcode scanning
- [x] GST calculations
- [x] Multi-payment support

### Phase 2: Inventory ✅
- [x] Purchase orders
- [x] Stock adjustments
- [x] Low stock alerts
- [x] Supplier management

### Phase 3: Advanced Features ✅
- [x] Multi-store support
- [x] Role-based access
- [x] Loyalty program
- [x] Offer engine
- [x] Activity logs

### Phase 4: Analytics & Reports (In Progress)
- [x] Sales dashboard
- [x] Top products
- [ ] Advanced analytics
- [ ] Predictive inventory
- [ ] Customer insights

### Phase 5: Integrations (Planned)
- [ ] Payment gateway integration
- [ ] SMS/WhatsApp APIs
- [ ] Accounting software sync
- [ ] E-commerce integration

---

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment instructions
- **[API Routes](./server/routes-v2.ts)** - API endpoints
- **[Database Schema](./migrations/0001_readybasket_complete_schema.sql)** - SQL schema

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [TanStack Query](https://tanstack.com/query) - Powerful async state management

---

## 💬 Support

Need help? We're here for you!

- 🐛 Issues: [GitHub Issues](https://github.com/jeffreyroshan2006-crypto/Retail-BillFlow/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/jeffreyroshan2006-crypto/Retail-BillFlow/discussions)

---

<p align="center">
  <b>Built with ❤️ for retailers everywhere</b>
</p>

<p align="center">
  ReadyBasket POS © 2024
</p>
