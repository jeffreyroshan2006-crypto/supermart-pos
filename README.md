# 🇮🇳 SuperMart POS - World-Class Indian Retail Billing System

<p align="center">
  <img src="./attached_assets/generated_images/modern_retail_pos_logo_for_supermart.png" alt="SuperMart POS Logo" width="150" />
</p>

<p align="center">
  <b>A comprehensive, GST-compliant Point of Sale system designed for Indian retailers</b>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#indian-specific">Made for India</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## ✨ Features

### 🏪 Core POS Features
- **⚡ Lightning-fast billing** - Keyboard shortcuts, barcode scanning, minimal clicks
- **🛒 Smart cart with real-time GST** - Automatic CGST, SGST, IGST calculations
- **💳 Multiple payment modes** - Cash, UPI, Credit/Debit Card, Digital Wallets, Split payments
- **⏸️ Hold/Resume bills** - Handle multiple customers simultaneously
- **🎁 Advanced discounts** - Item-level & bill-level discounts, percentage & fixed amount
- **🏷️ Barcode scanning** - Works with any USB barcode scanner
- **📱 UPI QR Code** - Generate UPI QR codes for payments
- **🧾 Thermal printer support** - 58mm & 80mm receipt printers

### 💰 GST & Taxation
- **✅ GST Compliant** - Full support for CGST, SGST, IGST
- **📊 GST Rates** - 0%, 5%, 12%, 18%, 28% auto-applied based on HSN codes
- **🧾 GST Reports** - Monthly/quarterly GST filing reports
- **🏷️ HSN Codes** - Pre-configured for all products
- **📄 Tax Invoices** - GST-compliant bill format with QR code
- **📈 GST Analytics** - Track input/output tax

### 📦 Inventory Management
- **📊 Real-time stock tracking** - Automatic stock deduction on sales
- **⚠️ Low stock alerts** - Never run out of popular items
- **📝 Purchase orders** - Manage supplier orders
- **🔧 Stock adjustments** - Handle damage, expiry, returns
- **📦 Multi-unit support** - KG, Gram, Litre, Piece, Pack, etc.
- **🏷️ Barcode management** - SKU and barcode support
- **📈 Inventory reports** - Track stock movement

### 👥 Customer Management
- **📱 Phone-based lookup** - Quick customer search
- **🎁 Loyalty program** - Points per purchase, redemption
- **💳 Credit management** - Track customer credits
- **📧 GST Invoicing** - GSTIN support for B2B customers
- **📊 Purchase history** - View customer buying patterns
- **🎂 Birthday offers** - Special discounts on birthdays

### 🏪 Multi-Store Support
- **🏢 Organization management** - Manage multiple businesses
- **🏪 Store management** - Multiple locations per organization
- **👥 Role-based access** - Admin, Manager, Cashier roles
- **📊 Cross-store reports** - Compare store performance
- **🔄 Inter-store transfers** - Move stock between stores

### 📊 Reports & Analytics
- **📈 Sales reports** - Daily, weekly, monthly, yearly
- **🏆 Top products** - Best-selling items analysis
- **💰 Profit analysis** - Margin reports by product/category
- **📊 GST summary** - Tax filing made easy
- **👥 Customer analytics** - Buying patterns & loyalty
- **📦 Inventory reports** - Stock valuation & movement
- **💵 Cash flow** - Track all payments

### 🎨 Modern UI/UX
- **🌓 Glassmorphism design** - Beautiful frosted glass effects
- **🎨 Dark mode support** - Easy on eyes during long shifts
- **📱 Responsive design** - Works on desktop & tablet
- **⌨️ Keyboard shortcuts** - Power user friendly
- **🔄 Offline support** - Cart saves locally
- **🎯 Quick actions** - Fast access to common tasks

---

## 🇮🇳 Made for India

### Indian Product Catalog
✅ **500+ Indian products** pre-loaded:
- 🍚 Rice & Grains - India Gate, Daawat, Aashirvaad
- 🥛 Dairy - Amul, Mother Dairy, Nestle
- 🌶️ Spices - MDH, Everest, Catch
- 🛢️ Oil & Ghee - Fortune, Saffola, Amul
- 🧴 Personal Care - Dove, Himalaya, Dabur
- 🍪 Snacks - Lay's, Haldiram, Britannia
- 🧃 Beverages - Tata Tea, Nescafe, Coca-Cola
- 🏠 Household - Surf Excel, Vim, Harpic
- 👶 Baby Care - Pampers, Johnson's, Cerelac
- 📱 Electronics - Batteries, Chargers, LED Bulbs
- ✏️ Stationery - Classmate, Reynolds, Cello

### Indian Taxation
✅ **GST Ready**:
- CGST, SGST, IGST auto-calculation
- HSN codes for all products
- GST invoice format
- Monthly GST reports
- GSTR-1 ready

### Indian Payment Methods
✅ **Multiple payment options**:
- 💵 Cash
- 📱 UPI (PhonePe, GPay, Paytm)
- 💳 Credit/Debit Cards
- 👛 Digital Wallets
- 💰 Split payments

### Indian Number Format
✅ **Indian numbering system**:
- ₹ Indian Rupee symbol
- Lakhs & Crores formatting
- Amount in words (Rupees & Paise)
- Indian date format (DD/MM/YYYY)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/jeffreyroshan2006-crypto/supermart-pos.git
cd supermart-pos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npm run db:push

# Seed the database with Indian products
npm run db:seed

# Start development server
npm run dev
```

**Default login:**
- Email: `admin@supermart.in`
- Password: `admin123`

Visit `http://localhost:5000`

---

## 🌐 Deployment

### Recommended: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `SESSION_SECRET` - Random string (generate with `openssl rand -base64 32`)
   - `NODE_ENV` - `production`
5. Click **Deploy**

That's it! Vercel will auto-deploy on every push.

### Alternative: Self-Hosting

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## 📊 System Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| **State Management** | TanStack Query (React Query) |
| **Backend** | Express.js, Node.js |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Auth** | Passport.js with sessions |
| **Validation** | Zod |

### Database Schema

- **26 tables** with comprehensive relationships
- **Multi-tenant** architecture
- **Role-based access** control
- **Audit logging** for all actions

See [schema documentation](./migrations/0001_readybasket_complete_schema.sql)

---

## 🎯 Key Features Explained

### GST Calculation Example
```typescript
// For intra-state (same state) - CGST + SGST
Product: ₹1000
GST Rate: 18%
CGST (9%): ₹90
SGST (9%): ₹90
Total: ₹1180

// For inter-state (different state) - IGST
Product: ₹1000
GST Rate: 18%
IGST (18%): ₹180
Total: ₹1180
```

### Loyalty Program
- Earn 1 point per ₹1 spent
- Redeem points at ₹1 per point
- Automatic point calculation
- Customer tier management

### Barcode Scanning
- Works with any USB barcode scanner
- Automatic product lookup
- Sound feedback on scan
- Support for multiple barcode formats

---

## 🛣️ Roadmap

### Phase 1: Core POS ✅
- [x] Product management
- [x] Cart & checkout
- [x] GST calculations
- [x] Barcode scanning
- [x] Multi-payment support
- [x] 500+ Indian products

### Phase 2: Inventory ✅
- [x] Purchase orders
- [x] Stock adjustments
- [x] Low stock alerts
- [x] Supplier management
- [x] Multi-unit support

### Phase 3: Advanced Features ✅
- [x] Multi-store support
- [x] Role-based access
- [x] Loyalty program
- [x] GST reports
- [x] Customer analytics

### Phase 4: Coming Soon
- [ ] Mobile app for customers
- [ ] Online ordering
- [ ] SMS/WhatsApp integration
- [ ] Advanced analytics
- [ ] AI-based recommendations
- [ ] Multi-language support

---

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[VERCEL_SETUP_GUIDE.md](./VERCEL_SETUP_GUIDE.md)** - Vercel deployment steps
- **[GITHUB_PAGES_WARNING.md](./GITHUB_PAGES_WARNING.md)** - Why not to use GitHub Pages
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [TanStack Query](https://tanstack.com/query) - Powerful async state management

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

<p align="center">
  <b>Made with ❤️ for Indian retailers</b>
</p>

<p align="center">
  SuperMart POS © 2024 | Made in India 🇮🇳
</p>
