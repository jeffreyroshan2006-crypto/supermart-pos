import { pgTable, text, serial, integer, boolean, timestamp, numeric, date, json } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === Enums ===
export const userRoles = ["admin", "manager", "cashier"] as const;
export const paymentModes = ["cash", "upi", "card", "wallet"] as const;

// === Tables ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("cashier"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  sku: text("sku").notNull().unique(), // Barcode
  stockQuantity: integer("stock_quantity").notNull().default(0),
  purchasePrice: numeric("purchase_price").notNull(),
  sellingPrice: numeric("selling_price").notNull(),
  taxRate: numeric("tax_rate").notNull().default("0"), // Percentage
  supplierId: integer("supplier_id").references(() => suppliers.id),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique(),
  email: text("email"),
  loyaltyPoints: integer("loyalty_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").notNull().unique(),
  publicId: text("public_id").notNull().unique().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow(),
  subtotal: numeric("subtotal").notNull(),
  taxTotal: numeric("tax_total").notNull(),
  discountTotal: numeric("discount_total").default("0"),
  grandTotal: numeric("grand_total").notNull(),
  paymentMode: text("payment_mode", { enum: paymentModes }).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  cashierId: integer("cashier_id").references(() => users.id),
});

export const sessions = pgTable("session", {
  sid: text("sid").primaryKey().notNull(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(), // Unit price at time of sale
  tax: numeric("tax").notNull(), // Tax amount for this item
});

// === Relations ===

export const productsRelations = relations(products, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  cashier: one(users, {
    fields: [bills.cashierId],
    references: [users.id],
  }),
  items: many(billItems),
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

// === Zod Schemas ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, loyaltyPoints: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, date: true });
export const insertBillItemSchema = createInsertSchema(billItems).omit({ id: true });

// === Types ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = z.infer<typeof insertBillItemSchema>;

// API Request Types
export type CreateBillRequest = {
  paymentMode: typeof paymentModes[number];
  customerId?: number;
  items: {
    productId: number;
    quantity: number;
  }[];
  discountAmount?: number;
};
