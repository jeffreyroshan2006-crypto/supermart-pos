-- ============================================
-- ReadyBasket POS - Complete Database Schema
-- For Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'card', 'wallet', 'split');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE bill_status AS ENUM ('draft', 'completed', 'cancelled', 'hold', 'refunded');
CREATE TYPE purchase_order_status AS ENUM ('draft', 'ordered', 'partial', 'received', 'cancelled');
CREATE TYPE stock_adjustment_type AS ENUM ('damage', 'expiry', 'correction', 'return', 'theft');
CREATE TYPE offer_type AS ENUM ('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle');
CREATE TYPE activity_action AS ENUM (
  'login', 'logout', 'create', 'update', 'delete', 'print', 'export',
  'stock_adjust', 'bill_complete', 'bill_cancel', 'bill_hold', 'bill_resume'
);

-- ============================================
-- CORE TABLES - Multi-tenancy & Auth
-- ============================================

CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  status user_status DEFAULT 'active',
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  default_store_id INTEGER REFERENCES stores(id),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_stores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MASTER DATA TABLES
-- ============================================

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  parent_id INTEGER REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL,
  barcode TEXT,
  category_id INTEGER REFERENCES categories(id),
  brand_id INTEGER REFERENCES brands(id),
  unit_id INTEGER REFERENCES units(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  mrp NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  gst_rate NUMERIC NOT NULL DEFAULT 0,
  hsn_code TEXT,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock_level NUMERIC DEFAULT 10,
  max_stock_level NUMERIC,
  reorder_point NUMERIC DEFAULT 20,
  weight NUMERIC,
  dimensions JSONB,
  is_active BOOLEAN DEFAULT true,
  is_track_inventory BOOLEAN DEFAULT true,
  allow_negative_stock BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze',
  total_purchase_amount NUMERIC DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  birth_date DATE,
  anniversary_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVENTORY & PURCHASE TABLES
-- ============================================

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  po_number TEXT NOT NULL UNIQUE,
  reference_number TEXT,
  status purchase_order_status DEFAULT 'draft',
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  received_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_total NUMERIC NOT NULL DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  ordered_quantity NUMERIC NOT NULL,
  received_quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC NOT NULL,
  gst_rate NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock_adjustments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  adjustment_type stock_adjustment_type NOT NULL,
  quantity NUMERIC NOT NULL,
  reason TEXT,
  reference_number TEXT,
  adjustment_date DATE NOT NULL,
  cost_price NUMERIC,
  performed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BILLING TABLES
-- ============================================

CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL,
  public_id UUID NOT NULL DEFAULT gen_random_uuid(),
  status bill_status DEFAULT 'draft',
  counter_id TEXT DEFAULT 'C1',
  cashier_id INTEGER NOT NULL REFERENCES users(id),
  customer_id INTEGER REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_gstin TEXT,
  bill_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hold_time TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  item_discount_total NUMERIC DEFAULT 0,
  bill_discount_amount NUMERIC DEFAULT 0,
  bill_discount_percent NUMERIC DEFAULT 0,
  tax_total NUMERIC NOT NULL DEFAULT 0,
  cgst_total NUMERIC DEFAULT 0,
  sgst_total NUMERIC DEFAULT 0,
  igst_total NUMERIC DEFAULT 0,
  round_off NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  payment_mode payment_mode NOT NULL,
  payment_status payment_status DEFAULT 'completed',
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_redeemed INTEGER DEFAULT 0,
  loyalty_discount NUMERIC DEFAULT 0,
  notes TEXT,
  terms TEXT,
  is_printed BOOLEAN DEFAULT false,
  print_count INTEGER DEFAULT 0,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by INTEGER REFERENCES users(id),
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, bill_number)
);

CREATE TABLE bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  hsn_code TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  mrp NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  gst_rate NUMERIC DEFAULT 0,
  taxable_amount NUMERIC NOT NULL,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  is_returned BOOLEAN DEFAULT false,
  returned_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bill_payments (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  payment_mode payment_mode NOT NULL,
  amount NUMERIC NOT NULL,
  reference_number TEXT,
  transaction_id TEXT,
  card_last_four TEXT,
  card_network TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by INTEGER REFERENCES users(id)
);

CREATE TABLE held_bills (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  counter_id TEXT DEFAULT 'C1',
  cashier_id INTEGER NOT NULL REFERENCES users(id),
  hold_reference TEXT NOT NULL,
  customer_name TEXT,
  cart_data JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resumed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- ============================================
-- OFFERS & DISCOUNTS
-- ============================================

CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  offer_type offer_type NOT NULL,
  discount_percent NUMERIC,
  discount_amount NUMERIC,
  buy_quantity INTEGER,
  get_quantity INTEGER,
  bundle_price NUMERIC,
  min_purchase_amount NUMERIC,
  max_discount_amount NUMERIC,
  applicable_categories JSONB,
  applicable_products JSONB,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_usage_count INTEGER,
  current_usage_count INTEGER DEFAULT 0,
  max_usage_per_customer INTEGER,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LOYALTY SYSTEM
-- ============================================

CREATE TABLE loyalty_transactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  bill_id INTEGER REFERENCES bills(id),
  transaction_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- ============================================
-- SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE store_settings (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_suffix TEXT,
  next_invoice_number INTEGER DEFAULT 1,
  invoice_footer TEXT,
  invoice_terms TEXT,
  print_receipt_on_complete BOOLEAN DEFAULT true,
  show_logo_on_receipt BOOLEAN DEFAULT true,
  receipt_width TEXT DEFAULT '80mm',
  default_gst_rate NUMERIC DEFAULT 18,
  price_tax_inclusive BOOLEAN DEFAULT true,
  currency_code TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  loyalty_enabled BOOLEAN DEFAULT false,
  loyalty_points_per_rupee NUMERIC DEFAULT 1,
  loyalty_redemption_value NUMERIC DEFAULT 1,
  counter_name TEXT DEFAULT 'Counter 1',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id),
  user_id INTEGER REFERENCES users(id),
  action activity_action NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  description TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Organization indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_email ON organizations(email);

-- Store indexes
CREATE INDEX idx_stores_organization ON stores(organization_id);
CREATE INDEX idx_stores_code ON stores(code);

-- User indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_default_store ON users(default_store_id);

-- Product indexes
CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);

-- Customer indexes
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_customers_store ON customers(store_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Bill indexes
CREATE INDEX idx_bills_organization ON bills(organization_id);
CREATE INDEX idx_bills_store ON bills(store_id);
CREATE INDEX idx_bills_number ON bills(bill_number);
CREATE INDEX idx_bills_public_id ON bills(public_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_date ON bills(bill_date);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_cashier ON bills(cashier_id);

-- Bill items indexes
CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX idx_bill_items_product ON bill_items(product_id);

-- Purchase order indexes
CREATE INDEX idx_purchase_orders_organization ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_store ON purchase_orders(store_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Stock adjustment indexes
CREATE INDEX idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_date ON stock_adjustments(adjustment_date);

-- Activity log indexes
CREATE INDEX idx_activity_logs_organization ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Loyalty indexes
CREATE INDEX idx_loyalty_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_bill ON loyalty_transactions(bill_id);

-- Offer indexes
CREATE INDEX idx_offers_organization ON offers(organization_id);
CREATE INDEX idx_offers_dates ON offers(start_date, end_date);
CREATE INDEX idx_offers_active ON offers(is_active);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate bill number trigger
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  suffix TEXT;
  next_num INTEGER;
  org_id INTEGER;
BEGIN
  -- Get store settings
  SELECT ss.invoice_prefix, ss.invoice_suffix, ss.next_invoice_number, s.organization_id
  INTO prefix, suffix, next_num, org_id
  FROM store_settings ss
  JOIN stores s ON s.id = ss.store_id
  WHERE s.id = NEW.store_id;

  -- Generate bill number
  NEW.bill_number := COALESCE(prefix, 'INV') || '-' || LPAD(next_num::TEXT, 6, '0') || COALESCE('-' || suffix, '');
  
  -- Update invoice number
  UPDATE store_settings 
  SET next_invoice_number = next_invoice_number + 1
  WHERE store_id = NEW.store_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER before_bill_insert BEFORE INSERT ON bills
  FOR EACH ROW EXECUTE FUNCTION generate_bill_number();

-- Auto-cleanup held bills
CREATE OR REPLACE FUNCTION cleanup_expired_held_bills()
RETURNS void AS $$
BEGIN
  DELETE FROM held_bills 
  WHERE expires_at < NOW() 
  AND resumed_at IS NULL;
END;
$$ language 'plpgsql';

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (examples - customize based on your auth setup)
CREATE POLICY organization_isolation ON organizations
  FOR ALL USING (id = current_setting('app.current_org_id')::INTEGER);

CREATE POLICY store_isolation ON stores
  FOR ALL USING (organization_id = current_setting('app.current_org_id')::INTEGER);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Daily sales summary
CREATE VIEW daily_sales_summary AS
SELECT 
  DATE(bill_date) as sale_date,
  store_id,
  COUNT(*) as total_bills,
  SUM(subtotal) as total_subtotal,
  SUM(tax_total) as total_tax,
  SUM(grand_total) as total_sales,
  SUM(CASE WHEN payment_mode = 'cash' THEN grand_total ELSE 0 END) as cash_sales,
  SUM(CASE WHEN payment_mode = 'upi' THEN grand_total ELSE 0 END) as upi_sales,
  SUM(CASE WHEN payment_mode = 'card' THEN grand_total ELSE 0 END) as card_sales
FROM bills
WHERE status = 'completed'
GROUP BY DATE(bill_date), store_id;

-- Low stock alert view
CREATE VIEW low_stock_products AS
SELECT 
  p.*,
  c.name as category_name,
  s.name as store_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.stock_quantity <= p.min_stock_level
AND p.is_active = true
AND p.is_track_inventory = true;

-- Top selling products
CREATE VIEW top_selling_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  c.name as category_name,
  SUM(bi.quantity) as total_quantity_sold,
  SUM(bi.total_amount) as total_revenue,
  COUNT(DISTINCT bi.bill_id) as times_sold
FROM products p
JOIN bill_items bi ON bi.product_id = p.id
JOIN bills b ON b.id = bi.bill_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE b.status = 'completed'
AND b.bill_date >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.sku, c.name
ORDER BY total_quantity_sold DESC;

-- GST summary view
CREATE VIEW gst_summary AS
SELECT 
  DATE(bill_date) as date,
  store_id,
  SUM(cgst_total) as total_cgst,
  SUM(sgst_total) as total_sgst,
  SUM(igst_total) as total_igst,
  SUM(tax_total) as total_tax,
  SUM(subtotal) as taxable_value
FROM bills
WHERE status = 'completed'
GROUP BY DATE(bill_date), store_id;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default units
INSERT INTO units (organization_id, name, code) VALUES 
  (1, 'Piece', 'PCS'),
  (1, 'Kilogram', 'KG'),
  (1, 'Gram', 'GM'),
  (1, 'Liter', 'LTR'),
  (1, 'Milliliter', 'ML'),
  (1, 'Meter', 'MTR'),
  (1, 'Box', 'BOX'),
  (1, 'Pack', 'PACK'),
  (1, 'Dozen', 'DZ'),
  (1, 'Pair', 'PAIR');

-- Insert default categories
INSERT INTO categories (organization_id, name, description, color) VALUES
  (1, 'Groceries', 'Daily groceries and food items', '#22c55e'),
  (1, 'Beverages', 'Soft drinks, juices, and beverages', '#3b82f6'),
  (1, 'Snacks', 'Chips, biscuits, and snacks', '#f59e0b'),
  (1, 'Dairy', 'Milk, cheese, and dairy products', '#8b5cf6'),
  (1, 'Household', 'Cleaning and household items', '#06b6d4'),
  (1, 'Personal Care', 'Personal care and beauty products', '#ec4899'),
  (1, 'Stationery', 'Office and school supplies', '#6366f1');

-- ============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Calculate loyalty points
CREATE OR REPLACE FUNCTION calculate_loyalty_points(
  p_customer_id INTEGER,
  p_amount NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  points_per_rupee NUMERIC;
BEGIN
  SELECT loyalty_points_per_rupee INTO points_per_rupee
  FROM store_settings ss
  JOIN customers c ON c.store_id = ss.store_id
  WHERE c.id = p_customer_id;

  RETURN FLOOR(p_amount * COALESCE(points_per_rupee, 1));
END;
$$ language 'plpgsql';

-- Apply offer discount
CREATE OR REPLACE FUNCTION apply_offer_discount(
  p_offer_id INTEGER,
  p_cart_total NUMERIC,
  p_cart_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  offer_record RECORD;
  discount_amount NUMERIC := 0;
  result JSONB;
BEGIN
  SELECT * INTO offer_record FROM offers WHERE id = p_offer_id AND is_active = true;
  
  IF offer_record IS NULL OR offer_record.start_date > NOW() OR offer_record.end_date < NOW() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Offer not valid');
  END IF;

  IF offer_record.min_purchase_amount IS NOT NULL AND p_cart_total < offer_record.min_purchase_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Minimum purchase amount not met');
  END IF;

  CASE offer_record.offer_type
    WHEN 'percentage' THEN
      discount_amount := p_cart_total * (offer_record.discount_percent / 100);
      IF offer_record.max_discount_amount IS NOT NULL THEN
        discount_amount := LEAST(discount_amount, offer_record.max_discount_amount);
      END IF;
    WHEN 'fixed_amount' THEN
      discount_amount := offer_record.discount_amount;
    ELSE
      discount_amount := 0;
  END CASE;

  RETURN jsonb_build_object(
    'success', true,
    'discount_amount', discount_amount,
    'offer_name', offer_record.name
  );
END;
$$ language 'plpgsql';

-- Update product stock
CREATE OR REPLACE FUNCTION update_product_stock(
  p_product_id INTEGER,
  p_quantity_change NUMERIC,
  p_reason TEXT DEFAULT 'Stock update'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock NUMERIC;
  allow_negative BOOLEAN;
BEGIN
  SELECT stock_quantity, allow_negative_stock 
  INTO current_stock, allow_negative
  FROM products WHERE id = p_product_id;

  IF current_stock + p_quantity_change < 0 AND NOT allow_negative THEN
    RETURN false;
  END IF;

  UPDATE products 
  SET stock_quantity = stock_quantity + p_quantity_change
  WHERE id = p_product_id;

  RETURN true;
END;
$$ language 'plpgsql';
