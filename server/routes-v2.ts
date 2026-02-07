import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage-v2";
import { db } from "./db";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import {
  insertOrganizationSchema,
  insertStoreSchema,
  insertProductSchema,
  insertCustomerSchema,
  insertBillSchema,
  insertBillItemSchema,
  insertPurchaseOrderSchema,
  insertStockAdjustmentSchema,
  insertCategorySchema,
  insertBrandSchema,
  insertUnitSchema,
  insertSupplierSchema,
  insertOfferSchema,
  insertHeldBillSchema,
  insertStoreSettingsSchema,
  CreateBillRequest,
} from "../shared/schema";

// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden - insufficient permissions" });
  }
  next();
};

export async function registerRoutesV2(app: Express): Promise<void> {

  // ============================================
  // AUTH ROUTES
  // ============================================

  app.post("/api/auth/login", async (req, res) => {
    // Handled by passport in setupAuth
    res.json({ message: "Use /api/login" });
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.get("/api/auth/stores", requireAuth, async (req, res) => {
    try {
      const stores = await storage.getUserStores(req.user.id);
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/organization", requireAuth, async (req, res) => {
    try {
      const org = await storage.getOrganization(req.user.organizationId);
      res.json(org);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/switch-store", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.body;
      await storage.updateUserDefaultStore(req.user.id, storeId);
      res.json({ message: "Store switched successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // ORGANIZATION ROUTES
  // ============================================

  app.post("/api/organizations", async (req, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(data);
      res.status(201).json(org);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // STORE ROUTES
  // ============================================

  app.get("/api/stores", requireAuth, async (req, res) => {
    try {
      const stores = await storage.getStoresByOrganization(req.user.organizationId);
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stores", requireRole(["admin"]), async (req, res) => {
    try {
      const data = insertStoreSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      const store = await storage.createStore(data);
      res.status(201).json(store);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stores/:id", requireAuth, async (req, res) => {
    try {
      const store = await storage.getStore(Number(req.params.id));
      if (!store) return res.status(404).json({ message: "Store not found" });
      res.json(store);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // USER MANAGEMENT ROUTES
  // ============================================

  app.get("/api/users", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const users = await storage.getUsersByOrganization(req.user.organizationId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireRole(["admin"]), async (req, res) => {
    try {
      const hashedPassword = await hashPassword(req.body.password);
      const data = insertUserSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
        password: hashedPassword,
      });
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // CATEGORY ROUTES
  // ============================================

  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategoriesByOrganization(req.user.organizationId);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const data = insertCategorySchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // BRAND ROUTES
  // ============================================

  app.get("/api/brands", requireAuth, async (req, res) => {
    try {
      const brands = await storage.getBrandsByOrganization(req.user.organizationId);
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const data = insertBrandSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      const brand = await storage.createBrand(data);
      res.status(201).json(brand);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // UNIT ROUTES
  // ============================================

  app.get("/api/units", requireAuth, async (req, res) => {
    try {
      const units = await storage.getUnitsByOrganization(req.user.organizationId);
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // SUPPLIER ROUTES
  // ============================================

  app.get("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliersByOrganization(req.user.organizationId);
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/suppliers", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const data = insertSupplierSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      const supplier = await storage.createSupplier(data);
      res.status(201).json(supplier);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // PRODUCT ROUTES
  // ============================================

  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.defaultStoreId;
      const products = await storage.getProductsByStore(Number(storeId), {
        search: req.query.search as string,
        category: req.query.category ? Number(req.query.category) : undefined,
        brand: req.query.brand ? Number(req.query.brand) : undefined,
        lowStock: req.query.lowStock === 'true',
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      const barcode = req.query.barcode as string;
      const storeId = req.query.storeId || req.user.defaultStoreId;

      let products;
      if (barcode) {
        products = await storage.searchProductByBarcode(barcode, Number(storeId));
      } else {
        products = await storage.searchProducts(query, Number(storeId));
      }
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const data = insertProductSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
        storeId: req.body.storeId || req.user.defaultStoreId,
      });
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const product = await storage.updateProduct(Number(req.params.id), req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", requireRole(["admin"]), async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // CUSTOMER ROUTES
  // ============================================

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomersByOrganization(req.user.organizationId, {
        search: req.query.search as string,
        storeId: req.query.storeId ? Number(req.query.storeId) : undefined,
      });
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/customers/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      const customers = await storage.searchCustomers(query, req.user.organizationId);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(Number(req.params.id));
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const data = insertCustomerSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
        storeId: req.body.storeId || req.user.defaultStoreId,
      });
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(Number(req.params.id), req.body);
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // BILL ROUTES
  // ============================================

  app.get("/api/bills", requireAuth, async (req, res) => {
    try {
      const bills = await storage.getBillsByOrganization(req.user.organizationId, {
        storeId: req.query.storeId ? Number(req.query.storeId) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      });
      res.json(bills);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bills/:id", requireAuth, async (req, res) => {
    try {
      const bill = await storage.getBillWithItems(Number(req.params.id));
      if (!bill) return res.status(404).json({ message: "Bill not found" });
      res.json(bill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bills", requireAuth, async (req, res) => {
    try {
      const data: CreateBillRequest = req.body;
      const storeId = req.user.defaultStoreId;

      const bill = await storage.createBill({
        ...data,
        organizationId: req.user.organizationId,
        storeId,
        cashierId: req.user.id,
      });

      res.status(201).json(bill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bills/:id/cancel", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const { reason } = req.body;
      const bill = await storage.cancelBill(Number(req.params.id), req.user.id, reason);
      res.json(bill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // HELD BILL ROUTES
  // ============================================

  app.get("/api/bills/held", requireAuth, async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.defaultStoreId;
      const heldBills = await storage.getHeldBillsByStore(Number(storeId));
      res.json(heldBills);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bills/hold", requireAuth, async (req, res) => {
    try {
      const storeId = req.user.defaultStoreId;
      const heldBill = await storage.createHeldBill({
        ...req.body,
        organizationId: req.user.organizationId,
        storeId,
        cashierId: req.user.id,
      });
      res.status(201).json(heldBill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bills/hold/:id/resume", requireAuth, async (req, res) => {
    try {
      const heldBill = await storage.resumeHeldBill(Number(req.params.id));
      res.json(heldBill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/bills/hold/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteHeldBill(Number(req.params.id));
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // PURCHASE ORDER ROUTES
  // ============================================

  app.get("/api/purchase-orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrdersByStore(req.user.defaultStoreId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/purchase-orders", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const data = insertPurchaseOrderSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
        storeId: req.user.defaultStoreId,
        createdBy: req.user.id,
      });
      const order = await storage.createPurchaseOrder(data);
      res.status(201).json(order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/purchase-orders/:id/receive", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const { items } = req.body; // Array of { productId, receivedQuantity }
      const order = await storage.receivePurchaseOrder(Number(req.params.id), items);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // STOCK ADJUSTMENT ROUTES
  // ============================================

  app.get("/api/stock-adjustments", requireAuth, async (req, res) => {
    try {
      const adjustments = await storage.getStockAdjustmentsByStore(req.user.defaultStoreId);
      res.json(adjustments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stock-adjustments", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const data = insertStockAdjustmentSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
        storeId: req.user.defaultStoreId,
        performedBy: req.user.id,
      });
      const adjustment = await storage.createStockAdjustment(data);
      res.status(201).json(adjustment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // REPORTS ROUTES
  // ============================================

  app.get("/api/reports/sales-summary", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, storeId } = req.query;
      const summary = await storage.getSalesSummary({
        startDate: startDate as string,
        endDate: endDate as string,
        storeId: storeId ? Number(storeId) : req.user.defaultStoreId,
      });
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/top-products", requireAuth, async (req, res) => {
    try {
      const { days = 30, storeId } = req.query;
      const products = await storage.getTopSellingProducts({
        days: Number(days),
        storeId: storeId ? Number(storeId) : req.user.defaultStoreId,
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/gst-summary", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, storeId } = req.query;
      const summary = await storage.getGstSummary({
        startDate: startDate as string,
        endDate: endDate as string,
        storeId: storeId ? Number(storeId) : req.user.defaultStoreId,
      });
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/low-stock", requireAuth, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts(req.user.defaultStoreId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // SETTINGS ROUTES
  // ============================================

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getStoreSettings(req.user.defaultStoreId);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/settings", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const settings = await storage.updateStoreSettings(req.user.defaultStoreId, req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  app.get("/api/public/bills/:publicId", async (req, res) => {
    try {
      const bill = await storage.getBillByPublicId(req.params.publicId);
      if (!bill) return res.status(404).json({ message: "Bill not found" });
      res.json(bill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}
