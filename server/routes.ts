import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, hashPassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Authentication
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  app.get("/api/health", async (req, res) => {
    try {
      await storage.getUser(1); // Simple DB check
      res.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // === Products ===
  app.get(api.products.list.path, requireAuth, async (req, res) => {
    const products = await storage.getProducts(
      req.query.search as any,
      req.query.category as any
    );
    res.json(products);
  });

  app.get(api.products.get.path, requireAuth, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.put(api.products.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      res.json(product);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.products.delete.path, requireAuth, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Customers ===
  app.get(api.customers.list.path, requireAuth, async (req, res) => {
    const customers = await storage.getCustomers(req.query.search as string);
    res.json(customers);
  });

  app.post(api.customers.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer(input);
      res.status(201).json(customer);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  // === Bills ===
  app.post(api.bills.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.bills.create.input.parse(req.body);
      const bill = await storage.createBill(input, (req.user as any).id);
      res.status(201).json(bill);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error processing bill" });
    }
  });

  app.get(api.bills.list.path, requireAuth, async (req, res) => {
    const bills = await storage.getBills();
    res.json(bills);
  });

  app.get(api.bills.getPublic.path, async (req, res) => {
    const result = await storage.getBillByPublicId(req.params.publicId as string);
    if (!result) return res.status(404).json({ message: "Bill not found" });
    res.json(result);
  });

  // === Stats ===
  app.get(api.stats.dashboard.path, requireAuth, async (req, res) => {
    const dailySales = await storage.getDailySales();
    const topProducts = await storage.getTopProducts();
    const lowStock = await storage.getLowStockProducts();

    res.json({
      dailySales,
      topProducts,
      lowStock
    });
  });

  // === Seed Data ===
  // Attempt to seed, but don't block/crash if DB is temporarily unreachable
  seed().catch(err => {
    console.error("Failed to seed database on startup (non-fatal):", err.message);
  });

  return httpServer;
}

async function seed() {
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "System Admin",
      role: "admin",
    });
  }

  const products_list = await storage.getProducts();
  if (products_list.length <= 3) {
    // Seed Products with INR prices
    const seedProducts = [
      {
        name: "Aashirvaad Shudhh Chakki Atta 5kg",
        category: "Groceries",
        sku: "ATTA001",
        stockQuantity: 100,
        purchasePrice: "210.00",
        sellingPrice: "245.00",
        taxRate: "0",
        supplierId: null,
        expiryDate: "2024-12-31"
      },
      {
        name: "Amul Butter 500g",
        category: "Dairy",
        sku: "BTR001",
        stockQuantity: 50,
        purchasePrice: "230.00",
        sellingPrice: "275.00",
        taxRate: "5.00",
        supplierId: null,
        expiryDate: "2024-06-30"
      },
      {
        name: "Tata Tea Gold 1kg",
        category: "Beverages",
        sku: "TEA001",
        stockQuantity: 40,
        purchasePrice: "480.00",
        sellingPrice: "625.00",
        taxRate: "5.00",
        supplierId: null,
        expiryDate: "2025-01-01"
      },
      {
        name: "Maggi 2-Minute Noodles 12pk",
        category: "Snacks",
        sku: "MAG001",
        stockQuantity: 80,
        purchasePrice: "140.00",
        sellingPrice: "168.00",
        taxRate: "12.00",
        supplierId: null,
        expiryDate: "2024-09-15"
      },
      {
        name: "Surf Excel Matic Front Load 2kg",
        category: "Cleaning",
        sku: "DET001",
        stockQuantity: 30,
        purchasePrice: "380.00",
        sellingPrice: "450.00",
        taxRate: "18.00",
        supplierId: null,
        expiryDate: null
      },
      {
        name: "Dettol Liquid Handwash Refill 1.5L",
        category: "Personal Care",
        sku: "HWS001",
        stockQuantity: 25,
        purchasePrice: "190.00",
        sellingPrice: "230.00",
        taxRate: "18.00",
        supplierId: null,
        expiryDate: "2025-05-10"
      }
    ];

    for (const p of seedProducts) {
      await storage.createProduct(p);
    }

    await storage.createCustomer({
      name: "Rahul Sharma",
      phone: "9123456780",
      email: "rahul@example.in",
    });
  }
}
