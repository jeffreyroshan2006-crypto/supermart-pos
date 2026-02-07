import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { z } from "zod";
import { setupAuth, hashPassword } from "./auth";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === Health Check (Move above Auth to prevent blocking crashes) ===
  app.get("/api/health", async (req, res) => {
    try {
      if (!db) {
        throw new Error("Database instance (db) is null. Check environment variables.");
      }
      await storage.getUser(1); // Simple DB check
      res.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      console.error("Health check failed:", err.message);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Set up Authentication
  setupAuth(app);

  // No-op requireAuth to make site "open" as requested
  const requireAuth = (req: any, res: any, next: any) => {
    return next();
  };


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
      const cashierId = (req.user as any)?.id || 1; // Default to admin if not logged in
      const bill = await storage.createBill(input, cashierId);
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
    // Seed Products with INR prices - Indian Retail Products
    const seedProducts = [
      // GROCERIES
      { name: "India Gate Basmati Rice 5kg", category: "Rice & Grains", sku: "RICE001", stockQuantity: 50, purchasePrice: "420.00", sellingPrice: "485.00", gstRate: "5", supplierId: null },
      { name: "Daawat Rozana Gold 1kg", category: "Rice & Grains", sku: "RICE002", stockQuantity: 100, purchasePrice: "75.00", sellingPrice: "88.00", gstRate: "5", supplierId: null },
      { name: "Aashirvaad Atta 5kg", category: "Groceries", sku: "ATTA001", stockQuantity: 80, purchasePrice: "195.00", sellingPrice: "225.00", gstRate: "0", supplierId: null },
      { name: "Pillsbury Chakki Fresh Atta 10kg", category: "Groceries", sku: "ATTA002", stockQuantity: 40, purchasePrice: "380.00", sellingPrice: "425.00", gstRate: "0", supplierId: null },
      { name: "Fortune Maida 1kg", category: "Groceries", sku: "MAIDA001", stockQuantity: 60, purchasePrice: "42.00", sellingPrice: "50.00", gstRate: "0", supplierId: null },
      
      // DAIRY
      { name: "Amul Taaza Milk 1L", category: "Dairy & Eggs", sku: "MILK001", stockQuantity: 200, purchasePrice: "58.00", sellingPrice: "68.00", gstRate: "0", supplierId: null },
      { name: "Amul Gold Milk 500ml", category: "Dairy & Eggs", sku: "MILK002", stockQuantity: 150, purchasePrice: "32.00", sellingPrice: "38.00", gstRate: "0", supplierId: null },
      { name: "Amul Butter 500g", category: "Dairy & Eggs", sku: "BUTTER001", stockQuantity: 40, purchasePrice: "225.00", sellingPrice: "260.00", gstRate: "12", supplierId: null },
      { name: "Amul Cheese Slices 200g", category: "Dairy & Eggs", sku: "CHEESE001", stockQuantity: 35, purchasePrice: "108.00", sellingPrice: "125.00", gstRate: "12", supplierId: null },
      { name: "Amul Paneer 200g", category: "Dairy & Eggs", sku: "PANEER001", stockQuantity: 45, purchasePrice: "75.00", sellingPrice: "88.00", gstRate: "0", supplierId: null },
      { name: "Amul Curd 400g", category: "Dairy & Eggs", sku: "CURD001", stockQuantity: 80, purchasePrice: "42.00", sellingPrice: "48.00", gstRate: "0", supplierId: null },
      { name: "Farm Fresh Eggs 12pcs", category: "Dairy & Eggs", sku: "EGGS001", stockQuantity: 100, purchasePrice: "75.00", sellingPrice: "88.00", gstRate: "0", supplierId: null },
      
      // SPICES & MASALA
      { name: "MDH Deggi Mirch 100g", category: "Spices & Masala", sku: "SPICE001", stockQuantity: 40, purchasePrice: "68.00", sellingPrice: "78.00", gstRate: "0", supplierId: null },
      { name: "MDH Haldi Powder 100g", category: "Spices & Masala", sku: "SPICE002", stockQuantity: 45, purchasePrice: "34.00", sellingPrice: "38.00", gstRate: "0", supplierId: null },
      { name: "Everest Garam Masala 100g", category: "Spices & Masala", sku: "SPICE003", stockQuantity: 35, purchasePrice: "76.00", sellingPrice: "88.00", gstRate: "0", supplierId: null },
      { name: "Everest Kitchen King Masala 100g", category: "Spices & Masala", sku: "SPICE004", stockQuantity: 40, purchasePrice: "66.00", sellingPrice: "75.00", gstRate: "0", supplierId: null },
      
      // OIL & GHEE
      { name: "Fortune Sunflower Oil 1L", category: "Oil & Ghee", sku: "OIL001", stockQuantity: 60, purchasePrice: "132.00", sellingPrice: "152.00", gstRate: "5", supplierId: null },
      { name: "Fortune Mustard Oil 1L", category: "Oil & Ghee", sku: "OIL002", stockQuantity: 50, purchasePrice: "148.00", sellingPrice: "172.00", gstRate: "5", supplierId: null },
      { name: "Saffola Gold Oil 1L", category: "Oil & Ghee", sku: "OIL003", stockQuantity: 45, purchasePrice: "156.00", sellingPrice: "182.00", gstRate: "5", supplierId: null },
      { name: "Amul Pure Ghee 1L", category: "Oil & Ghee", sku: "GHEE001", stockQuantity: 25, purchasePrice: "520.00", sellingPrice: "595.00", gstRate: "12", supplierId: null },
      
      // SNACKS
      { name: "Lay's Classic Salted 52g", category: "Snacks", sku: "CHIPS001", stockQuantity: 150, purchasePrice: "15.00", sellingPrice: "18.00", gstRate: "12", supplierId: null },
      { name: "Lay's Magic Masala 52g", category: "Snacks", sku: "CHIPS002", stockQuantity: 140, purchasePrice: "15.00", sellingPrice: "18.00", gstRate: "12", supplierId: null },
      { name: "Bingo! Mad Angles 45g", category: "Snacks", sku: "CHIPS003", stockQuantity: 200, purchasePrice: "7.50", sellingPrice: "9.00", gstRate: "12", supplierId: null },
      { name: "Haldiram's Bhujia Sev 200g", category: "Snacks", sku: "NAMKEEN001", stockQuantity: 60, purchasePrice: "76.00", sellingPrice: "88.00", gstRate: "12", supplierId: null },
      { name: "Britannia Good Day Cashew 72g", category: "Snacks", sku: "BISCUIT001", stockQuantity: 120, purchasePrice: "19.00", sellingPrice: "22.00", gstRate: "18", supplierId: null },
      { name: "Parle-G Gold 100g", category: "Snacks", sku: "BISCUIT002", stockQuantity: 200, purchasePrice: "11.00", sellingPrice: "13.00", gstRate: "18", supplierId: null },
      { name: "Monaco Classic 76.8g", category: "Snacks", sku: "BISCUIT003", stockQuantity: 100, purchasePrice: "19.00", sellingPrice: "22.00", gstRate: "18", supplierId: null },
      
      // BEVERAGES
      { name: "Tata Tea Gold 250g", category: "Beverages", sku: "TEA001", stockQuantity: 50, purchasePrice: "132.00", sellingPrice: "152.00", gstRate: "5", supplierId: null },
      { name: "Brooke Bond Red Label 250g", category: "Beverages", sku: "TEA002", stockQuantity: 55, purchasePrice: "116.00", sellingPrice: "135.00", gstRate: "5", supplierId: null },
      { name: "Nescafe Classic 50g", category: "Beverages", sku: "COFFEE001", stockQuantity: 40, purchasePrice: "132.00", sellingPrice: "152.00", gstRate: "5", supplierId: null },
      { name: "Bru Instant Coffee 100g", category: "Beverages", sku: "COFFEE002", stockQuantity: 30, purchasePrice: "228.00", sellingPrice: "265.00", gstRate: "5", supplierId: null },
      { name: "Coca-Cola 750ml", category: "Beverages", sku: "COLDDRINK001", stockQuantity: 100, purchasePrice: "32.00", sellingPrice: "37.00", gstRate: "28", supplierId: null },
      { name: "Sprite 750ml", category: "Beverages", sku: "COLDDRINK002", stockQuantity: 95, purchasePrice: "32.00", sellingPrice: "37.00", gstRate: "28", supplierId: null },
      { name: "Thums Up 750ml", category: "Beverages", sku: "COLDDRINK003", stockQuantity: 90, purchasePrice: "32.00", sellingPrice: "37.00", gstRate: "28", supplierId: null },
      { name: "Tropicana Orange 1L", category: "Beverages", sku: "JUICE001", stockQuantity: 45, purchasePrice: "88.00", sellingPrice: "102.00", gstRate: "12", supplierId: null },
      { name: "Real Fruit Power Mango 1L", category: "Beverages", sku: "JUICE002", stockQuantity: 40, purchasePrice: "84.00", sellingPrice: "98.00", gstRate: "12", supplierId: null },
      
      // PERSONAL CARE
      { name: "Dove Cream Beauty Bar 100g", category: "Personal Care", sku: "SOAP001", stockQuantity: 100, purchasePrice: "44.00", sellingPrice: "51.00", gstRate: "18", supplierId: null },
      { name: "Santoor Sandal Soap 150g", category: "Personal Care", sku: "SOAP002", stockQuantity: 120, purchasePrice: "38.00", sellingPrice: "44.00", gstRate: "18", supplierId: null },
      { name: "Dove Shampoo 340ml", category: "Personal Care", sku: "SHAMPOO001", stockQuantity: 35, purchasePrice: "228.00", sellingPrice: "265.00", gstRate: "18", supplierId: null },
      { name: "Clinic Plus Shampoo 340ml", category: "Personal Care", sku: "SHAMPOO002", stockQuantity: 40, purchasePrice: "148.00", sellingPrice: "172.00", gstRate: "18", supplierId: null },
      { name: "Colgate Strong Teeth 200g", category: "Personal Care", sku: "PASTE001", stockQuantity: 60, purchasePrice: "92.00", sellingPrice: "108.00", gstRate: "18", supplierId: null },
      { name: "Patanjali Dant Kanti 200g", category: "Personal Care", sku: "PASTE002", stockQuantity: 50, purchasePrice: "76.00", sellingPrice: "88.00", gstRate: "18", supplierId: null },
      { name: "Lifebuoy Handwash 190ml", category: "Personal Care", sku: "HANDWASH001", stockQuantity: 45, purchasePrice: "68.00", sellingPrice: "78.00", gstRate: "18", supplierId: null },
      { name: "Dettol Liquid 500ml", category: "Personal Care", sku: "DETTOL001", stockQuantity: 35, purchasePrice: "156.00", sellingPrice: "182.00", gstRate: "18", supplierId: null },
      
      // HOUSEHOLD
      { name: "Surf Excel Matic Top Load 2kg", category: "Household", sku: "DETERGENT001", stockQuantity: 40, purchasePrice: "360.00", sellingPrice: "415.00", gstRate: "18", supplierId: null },
      { name: "Ariel Matic 2kg", category: "Household", sku: "DETERGENT002", stockQuantity: 35, purchasePrice: "380.00", sellingPrice: "438.00", gstRate: "18", supplierId: null },
      { name: "Tide Plus 2kg", category: "Household", sku: "DETERGENT003", stockQuantity: 45, purchasePrice: "316.00", sellingPrice: "365.00", gstRate: "18", supplierId: null },
      { name: "Rin Bar 250g", category: "Household", sku: "DETERGENT004", stockQuantity: 150, purchasePrice: "19.00", sellingPrice: "22.00", gstRate: "18", supplierId: null },
      { name: "Vim Dishwash Bar 200g", category: "Household", sku: "DISH001", stockQuantity: 180, purchasePrice: "15.00", sellingPrice: "18.00", gstRate: "18", supplierId: null },
      { name: "Vim Liquid 500ml", category: "Household", sku: "DISH002", stockQuantity: 50, purchasePrice: "92.00", sellingPrice: "108.00", gstRate: "18", supplierId: null },
      { name: "Harpic Power Plus 500ml", category: "Household", sku: "TOILET001", stockQuantity: 45, purchasePrice: "76.00", sellingPrice: "88.00", gstRate: "18", supplierId: null },
      { name: "Lizol Disinfectant 500ml", category: "Household", sku: "FLOOR001", stockQuantity: 40, purchasePrice: "92.00", sellingPrice: "108.00", gstRate: "18", supplierId: null },
      { name: "Good Knight Fast Card 10pcs", category: "Household", sku: "MOSQUITO001", stockQuantity: 80, purchasePrice: "27.00", sellingPrice: "32.00", gstRate: "18", supplierId: null },
      
      // BABY CARE
      { name: "Pampers Baby Dry Pants M 56pcs", category: "Baby Care", sku: "DIAPER001", stockQuantity: 30, purchasePrice: "680.00", sellingPrice: "785.00", gstRate: "12", supplierId: null },
      { name: "Huggies Wonder Pants L 48pcs", category: "Baby Care", sku: "DIAPER002", stockQuantity: 25, purchasePrice: "740.00", sellingPrice: "855.00", gstRate: "12", supplierId: null },
      { name: "Johnson's Baby Powder 200g", category: "Baby Care", sku: "BABYPOWDER001", stockQuantity: 40, purchasePrice: "108.00", sellingPrice: "125.00", gstRate: "18", supplierId: null },
      { name: "Johnson's Baby Soap 100g", category: "Baby Care", sku: "BABYSOAP001", stockQuantity: 50, purchasePrice: "60.00", sellingPrice: "69.00", gstRate: "18", supplierId: null },
      { name: "Cerelac Stage 1 Rice 300g", category: "Baby Care", sku: "CERELAC001", stockQuantity: 35, purchasePrice: "148.00", sellingPrice: "172.00", gstRate: "5", supplierId: null },
      
      // ELECTRONICS
      { name: "Duracell AA Batteries 4pcs", category: "Electronics", sku: "BATTERY001", stockQuantity: 60, purchasePrice: "115.00", sellingPrice: "132.00", gstRate: "18", supplierId: null },
      { name: "Eveready Red AA 4pcs", category: "Electronics", sku: "BATTERY002", stockQuantity: 100, purchasePrice: "43.00", sellingPrice: "50.00", gstRate: "18", supplierId: null },
      { name: "Philips LED Bulb 9W", category: "Electronics", sku: "BULB001", stockQuantity: 40, purchasePrice: "99.00", sellingPrice: "115.00", gstRate: "12", supplierId: null },
      { name: "Havells LED Bulb 12W", category: "Electronics", sku: "BULB002", stockQuantity: 35, purchasePrice: "115.00", sellingPrice: "132.00", gstRate: "12", supplierId: null },
      { name: "Syska Mobile Charger", category: "Electronics", sku: "CHARGER001", stockQuantity: 25, purchasePrice: "235.00", sellingPrice: "272.00", gstRate: "18", supplierId: null },
      { name: "SanDisk 32GB Pen Drive", category: "Electronics", sku: "PENDRIVE001", stockQuantity: 20, purchasePrice: "360.00", sellingPrice: "415.00", gstRate: "18", supplierId: null },
      
      // STATIONERY
      { name: "Classmate Notebook A4 172pgs", category: "Stationery", sku: "NOTEBOOK001", stockQuantity: 60, purchasePrice: "59.00", sellingPrice: "69.00", gstRate: "12", supplierId: null },
      { name: "Navneet Notebook A4 140pgs", category: "Stationery", sku: "NOTEBOOK002", stockQuantity: 80, purchasePrice: "43.00", sellingPrice: "50.00", gstRate: "12", supplierId: null },
      { name: "Reynolds Trimax Pen Blue", category: "Stationery", sku: "PEN001", stockQuantity: 100, purchasePrice: "31.00", sellingPrice: "36.00", gstRate: "12", supplierId: null },
      { name: "Cello Butterflow Pen Blue", category: "Stationery", sku: "PEN002", stockQuantity: 150, purchasePrice: "15.00", sellingPrice: "18.00", gstRate: "12", supplierId: null },
      { name: "Faber-Castell Pencils 10pcs", category: "Stationery", sku: "PENCIL001", stockQuantity: 70, purchasePrice: "51.00", sellingPrice: "59.00", gstRate: "12", supplierId: null },
      { name: "Apsara Platinum Pencils 10pcs", category: "Stationery", sku: "PENCIL002", stockQuantity: 80, purchasePrice: "43.00", sellingPrice: "50.00", gstRate: "12", supplierId: null },
    ];

    for (const p of seedProducts) {
      await storage.createProduct(p);
    }

    // Seed Customers
    await storage.createCustomer({
      name: "Walk-in Customer",
      phone: "0000000000",
      email: "",
    });
    await storage.createCustomer({
      name: "Rahul Sharma",
      phone: "9123456780",
      email: "rahul@example.in",
    });
    await storage.createCustomer({
      name: "Priya Sharma",
      phone: "9876543210",
      email: "priya@example.in",
    });
    await storage.createCustomer({
      name: "Suresh Patel",
      phone: "9876543211",
      email: "suresh@example.in",
    });
    await storage.createCustomer({
      name: "Anita Reddy",
      phone: "9876543212",
      email: "anita@example.in",
    });
  }
}
