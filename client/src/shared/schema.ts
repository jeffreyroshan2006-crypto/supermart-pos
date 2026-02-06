import { pgTable, text, serial, integer, boolean, timestamp, numeric, date, json, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "cashier"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);
export const paymentModes = ["cash", "upi", "card", "wallet", "split"] as const;
export const paymentModeEnum = pgEnum("payment_mode", paymentModes);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const billStatusEnum = pgEnum("bill_status", ["draft", "completed", "cancelled", "hold", "refunded"]);
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", ["draft", "ordered", "partial", "received", "cancelled"]);
export const stockAdjustmentTypeEnum = pgEnum("stock_adjustment_type", ["damage", "expiry", "correction", "return", "theft"]);
export const offerTypeEnum = pgEnum("offer_type", ["percentage", "fixed_amount", "buy_x_get_y", "bundle"]);
export const activityActionEnum = pgEnum("activity_action", [
  "login", "logout", "create", "update", "delete", "print", "export",
  "stock_adjust", "bill_complete", "bill_cancel", "bill_hold", "bill_resume"
]);

// ============================================
// CORE TABLES - Multi-tenancy & Auth
// ============================================

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  gstin: text("gstin"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  subscriptionPlan: text("subscription_plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(), // Short code like "MAIN", "BR01"
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("cashier"),
  status: userStatusEnum("status").default("active"),
  name: text("name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  defaultStoreId: integer("default_store_id").references(() => stores.id),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userStores = pgTable("user_stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storeId: integer("store_id").references(() => stores.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// MASTER DATA TABLES
// ============================================

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  icon: text("icon"),
  parentId: integer("parent_id").references((): any => categories.id),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(), // e.g., "Piece", "Kg", "Liter"
  code: text("code").notNull(), // e.g., "PCS", "KG", "LTR"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull(), // Barcode/Unique code
  barcode: text("barcode"), // Additional barcode if different from SKU
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  unitId: integer("unit_id").references(() => units.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),

  // Pricing
  mrp: numeric("mrp").notNull(), // Maximum Retail Price
  purchasePrice: numeric("purchase_price").notNull(),
  sellingPrice: numeric("selling_price").notNull(),

  // GST/Tax (Indian context)
  gstRate: numeric("gst_rate").notNull().default("0"), // 0, 5, 12, 18, 28
  hsnCode: text("hsn_code"), // Harmonized System of Nomenclature

  // Stock
  stockQuantity: numeric("stock_quantity").notNull().default("0"),
  minStockLevel: numeric("min_stock_level").default("10"),
  maxStockLevel: numeric("max_stock_level"),
  reorderPoint: numeric("reorder_point").default("20"),

  // Physical
  weight: numeric("weight"),
  dimensions: json("dimensions"), // {length, width, height}

  // Status
  isActive: boolean("is_active").default(true),
  isTrackInventory: boolean("is_track_inventory").default(true),
  allowNegativeStock: boolean("allow_negative_stock").default(false),

  // Media
  imageUrl: text("image_url"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),

  // Address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),

  // Loyalty
  loyaltyPoints: integer("loyalty_points").default(0),
  loyaltyTier: text("loyalty_tier").default("bronze"), // bronze, silver, gold, platinum
  totalPurchaseAmount: numeric("total_purchase_amount").default("0"),
  visitCount: integer("visit_count").default(0),

  // CRM
  birthDate: date("birth_date"),
  anniversaryDate: date("anniversary_date"),
  notes: text("notes"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// INVENTORY & PURCHASE TABLES
// ============================================

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),

  poNumber: text("po_number").notNull().unique(),
  referenceNumber: text("reference_number"), // Supplier's reference
  status: purchaseOrderStatusEnum("status").default("draft"),

  orderDate: date("order_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  receivedDate: date("received_date"),

  subtotal: numeric("subtotal").notNull().default("0"),
  taxTotal: numeric("tax_total").notNull().default("0"),
  discountTotal: numeric("discount_total").default("0"),
  grandTotal: numeric("grand_total").notNull().default("0"),

  notes: text("notes"),
  terms: text("terms"),

  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),

  orderedQuantity: numeric("ordered_quantity").notNull(),
  receivedQuantity: numeric("received_quantity").default("0"),

  unitPrice: numeric("unit_price").notNull(),
  gstRate: numeric("gst_rate").default("0"),
  discountPercent: numeric("discount_percent").default("0"),

  totalAmount: numeric("total_amount").notNull(),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),

  adjustmentType: stockAdjustmentTypeEnum("adjustment_type").notNull(),
  quantity: numeric("quantity").notNull(), // Can be positive or negative
  reason: text("reason"),

  referenceNumber: text("reference_number"),
  adjustmentDate: date("adjustment_date").notNull(),

  costPrice: numeric("cost_price"), // For damage/theft valuation

  performedBy: integer("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// BILLING TABLES
// ============================================

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),

  billNumber: text("bill_number").notNull(),
  publicId: text("public_id").notNull().default(sql`gen_random_uuid()`),

  // Bill status
  status: billStatusEnum("status").default("draft"),

  // Counter and cashier
  counterId: text("counter_id").default("C1"),
  cashierId: integer("cashier_id").references(() => users.id).notNull(),

  // Customer
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerGstin: text("customer_gstin"),

  // Dates
  billDate: timestamp("bill_date").defaultNow(),
  holdTime: timestamp("hold_time"), // When bill was put on hold
  completedAt: timestamp("completed_at"),

  // Amounts
  subtotal: numeric("subtotal").notNull().default("0"),
  itemDiscountTotal: numeric("item_discount_total").default("0"),
  billDiscountAmount: numeric("bill_discount_amount").default("0"),
  billDiscountPercent: numeric("bill_discount_percent").default("0"),
  taxTotal: numeric("tax_total").notNull().default("0"),

  // GST Breakdown (for Indian GST filing)
  cgstTotal: numeric("cgst_total").default("0"),
  sgstTotal: numeric("sgst_total").default("0"),
  igstTotal: numeric("igst_total").default("0"),

  // Final amounts
  roundOff: numeric("round_off").default("0"),
  grandTotal: numeric("grand_total").notNull().default("0"),

  // Payment
  paymentMode: paymentModeEnum("payment_mode").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("completed"),

  // Loyalty
  loyaltyPointsEarned: integer("loyalty_points_earned").default(0),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed").default(0),
  loyaltyDiscount: numeric("loyalty_discount").default("0"),

  // Notes
  notes: text("notes"),
  terms: text("terms"),

  // Print/Share
  isPrinted: boolean("is_printed").default(false),
  printCount: integer("print_count").default(0),

  // Cancellation
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancellationReason: text("cancellation_reason"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),

  // Product snapshot at time of billing
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  hsnCode: text("hsn_code"),

  quantity: numeric("quantity").notNull(),
  unit: text("unit").notNull(),

  // Pricing
  mrp: numeric("mrp").notNull(),
  sellingPrice: numeric("selling_price").notNull(),

  // Item-level discount
  discountPercent: numeric("discount_percent").default("0"),
  discountAmount: numeric("discount_amount").default("0"),

  // Tax
  gstRate: numeric("gst_rate").default("0"),
  taxableAmount: numeric("taxable_amount").notNull(),
  cgstAmount: numeric("cgst_amount").default("0"),
  sgstAmount: numeric("sgst_amount").default("0"),
  igstAmount: numeric("igst_amount").default("0"),

  // Final
  totalAmount: numeric("total_amount").notNull(),

  // Return info
  isReturned: boolean("is_returned").default(false),
  returnedQuantity: numeric("returned_quantity").default("0"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const billPayments = pgTable("bill_payments", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id).notNull(),

  paymentMode: paymentModeEnum("payment_mode").notNull(),
  amount: numeric("amount").notNull(),

  // For UPI/Card
  referenceNumber: text("reference_number"),
  transactionId: text("transaction_id"),

  // For card
  cardLastFour: text("card_last_four"),
  cardNetwork: text("card_network"),

  receivedAt: timestamp("received_at").defaultNow(),
  receivedBy: integer("received_by").references(() => users.id),
});

export const heldBills = pgTable("held_bills", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  counterId: text("counter_id").default("C1"),
  cashierId: integer("cashier_id").references(() => users.id).notNull(),

  holdReference: text("hold_reference").notNull(), // e.g., "HOLD-001"
  customerName: text("customer_name"),

  // Serialized cart data
  cartData: json("cart_data").notNull(),
  subtotal: numeric("subtotal").notNull(),

  heldAt: timestamp("held_at").defaultNow(),
  resumedAt: timestamp("resumed_at"),
  expiresAt: timestamp("expires_at"), // Auto-delete after 24 hours

  notes: text("notes"),
});

// ============================================
// OFFERS & DISCOUNTS
// ============================================

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id),

  name: text("name").notNull(),
  description: text("description"),
  code: text("code").unique(), // e.g., "DIWALI2024"

  offerType: offerTypeEnum("offer_type").notNull(),

  // Value based on type
  discountPercent: numeric("discount_percent"), // For percentage
  discountAmount: numeric("discount_amount"), // For fixed_amount
  buyQuantity: integer("buy_quantity"), // For buy_x_get_y
  getQuantity: integer("get_quantity"), // For buy_x_get_y
  bundlePrice: numeric("bundle_price"), // For bundle

  // Conditions
  minPurchaseAmount: numeric("min_purchase_amount"),
  maxDiscountAmount: numeric("max_discount_amount"),
  applicableCategories: json("applicable_categories"), // Array of category IDs
  applicableProducts: json("applicable_products"), // Array of product IDs

  // Validity
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  // Usage limits
  maxUsageCount: integer("max_usage_count"),
  currentUsageCount: integer("current_usage_count").default(0),
  maxUsagePerCustomer: integer("max_usage_per_customer"),

  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority = applied first

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// LOYALTY SYSTEM
// ============================================

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  billId: integer("bill_id").references(() => bills.id),

  transactionType: text("transaction_type").notNull(), // "earn", "redeem", "expire", "adjust"
  points: integer("points").notNull(), // Positive for earn, negative for redeem

  description: text("description"),
  expiryDate: date("expiry_date"),

  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// ============================================
// SETTINGS & CONFIGURATION
// ============================================

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull().unique(),

  // Invoice settings
  invoicePrefix: text("invoice_prefix").default("INV"),
  invoiceSuffix: text("invoice_suffix"),
  nextInvoiceNumber: integer("next_invoice_number").default(1),
  invoiceFooter: text("invoice_footer"),
  invoiceTerms: text("invoice_terms"),

  // Print settings
  printReceiptOnComplete: boolean("print_receipt_on_complete").default(true),
  showLogoOnReceipt: boolean("show_logo_on_receipt").default(true),
  receiptWidth: text("receipt_width").default("80mm"), // 58mm, 80mm

  // Tax defaults
  defaultGstRate: numeric("default_gst_rate").default("18"),
  priceTaxInclusive: boolean("price_tax_inclusive").default(true),

  // Currency
  currencyCode: text("currency_code").default("INR"),
  currencySymbol: text("currency_symbol").default("₹"),

  // Loyalty
  loyaltyEnabled: boolean("loyalty_enabled").default(false),
  loyaltyPointsPerRupee: numeric("loyalty_points_per_rupee").default("1"),
  loyaltyRedemptionValue: numeric("loyalty_redemption_value").default("1"), // ₹1 per point

  // Counter
  counterName: text("counter_name").default("Counter 1"),

  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  storeId: integer("store_id").references(() => stores.id),
  userId: integer("user_id").references(() => users.id),

  action: activityActionEnum("action").notNull(),
  entityType: text("entity_type"), // "product", "bill", "customer", etc.
  entityId: integer("entity_id"),

  description: text("description"),
  oldData: json("old_data"),
  newData: json("new_data"),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  stores: many(stores),
  users: many(users),
  categories: many(categories),
  brands: many(brands),
  units: many(units),
  suppliers: many(suppliers),
  products: many(products),
  customers: many(customers),
  purchaseOrders: many(purchaseOrders),
  stockAdjustments: many(stockAdjustments),
  bills: many(bills),
  heldBills: many(heldBills),
  offers: many(offers),
  activityLogs: many(activityLogs),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [stores.organizationId],
    references: [organizations.id],
  }),
  products: many(products),
  customers: many(customers),
  purchaseOrders: many(purchaseOrders),
  stockAdjustments: many(stockAdjustments),
  bills: many(bills),
  heldBills: many(heldBills),
  settings: one(storeSettings, {
    fields: [stores.id],
    references: [storeSettings.storeId],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  defaultStore: one(stores, {
    fields: [users.defaultStoreId],
    references: [stores.id],
  }),
  userStores: many(userStores),
  bills: many(bills),
  activityLogs: many(activityLogs),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [categories.organizationId],
    references: [organizations.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [brands.organizationId],
    references: [organizations.id],
  }),
  products: many(products),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [units.organizationId],
    references: [organizations.id],
  }),
  products: many(products),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  products: many(products),
  purchaseOrders: many(purchaseOrders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  billItems: many(billItems),
  stockAdjustments: many(stockAdjustments),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  store: one(stores, {
    fields: [customers.storeId],
    references: [stores.id],
  }),
  bills: many(bills),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchaseOrders.organizationId],
    references: [organizations.id],
  }),
  store: one(stores, {
    fields: [purchaseOrders.storeId],
    references: [stores.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bills.organizationId],
    references: [organizations.id],
  }),
  store: one(stores, {
    fields: [bills.storeId],
    references: [stores.id],
  }),
  cashier: one(users, {
    fields: [bills.cashierId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  items: many(billItems),
  payments: many(billPayments),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
  product: one(products, {
    fields: [billItems.productId],
    references: [products.id],
  }),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(bills, {
    fields: [billPayments.billId],
    references: [bills.id],
  }),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [loyaltyTransactions.customerId],
    references: [customers.id],
  }),
  bill: one(bills, {
    fields: [loyaltyTransactions.billId],
    references: [bills.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [activityLogs.organizationId],
    references: [organizations.id],
  }),
  store: one(stores, {
    fields: [activityLogs.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true });
export const insertUserStoreSchema = createInsertSchema(userStores).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true, loyaltyPoints: true, totalPurchaseAmount: true, visitCount: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true, updatedAt: true, receivedDate: true });
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({ id: true, createdAt: true });
export const insertStockAdjustmentSchema = createInsertSchema(stockAdjustments).omit({ id: true, createdAt: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true, cancelledAt: true, holdTime: true });
export const insertBillItemSchema = createInsertSchema(billItems).omit({ id: true, createdAt: true });
export const insertBillPaymentSchema = createInsertSchema(billPayments).omit({ id: true, receivedAt: true });
export const insertHeldBillSchema = createInsertSchema(heldBills).omit({ id: true, heldAt: true, resumedAt: true });
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true, updatedAt: true, currentUsageCount: true });
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true, createdAt: true });
export const insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({ id: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

// ============================================
// TYPES
// ============================================

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserStore = typeof userStores.$inferSelect;
export type InsertUserStore = z.infer<typeof insertUserStoreSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type InsertStockAdjustment = z.infer<typeof insertStockAdjustmentSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = z.infer<typeof insertBillItemSchema>;

export type BillPayment = typeof billPayments.$inferSelect;
export type InsertBillPayment = z.infer<typeof insertBillPaymentSchema>;

export type HeldBill = typeof heldBills.$inferSelect;
export type InsertHeldBill = z.infer<typeof insertHeldBillSchema>;

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;

export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export type CartItem = {
  productId: number;
  quantity: number;
  price: number;
  discountPercent?: number;
};

export type CreateBillRequest = {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  paymentMode: "cash" | "upi" | "card" | "wallet" | "split";
  payments?: { mode: string; amount: number; reference?: string }[];
  billDiscountAmount?: number;
  billDiscountPercent?: number;
  loyaltyPointsRedeemed?: number;
  notes?: string;
};

export type HoldBillRequest = {
  customerName?: string;
  cartData: any;
  subtotal: number;
  notes?: string;
};

export type CreateStockAdjustmentRequest = {
  productId: number;
  adjustmentType: "damage" | "expiry" | "correction" | "return" | "theft";
  quantity: number;
  reason?: string;
  costPrice?: number;
};

export type CreatePurchaseOrderRequest = {
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: {
    productId: number;
    orderedQuantity: number;
    unitPrice: number;
    gstRate?: number;
    discountPercent?: number;
  }[];
  notes?: string;
};
