import {
  users, products, customers, bills, billItems, suppliers,
  type User, type InsertUser, type Product, type InsertProduct,
  type Customer, type InsertCustomer, type Bill, type InsertBill,
  type BillItem, type InsertBillItem, type Supplier, type InsertSupplier,
  type CreateBillRequest
} from "../shared/schema";
import { db } from "./db";
import { eq, like, desc, sql, lt, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(search?: string, category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(insertProduct: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Customers
  getCustomers(search?: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Bills
  createBill(billData: CreateBillRequest, cashierId: number): Promise<Bill>;
  getBills(): Promise<Bill[]>;
  getBillByPublicId(publicId: string): Promise<{ bill: Bill; items: any[] } | undefined>;

  // Stats
  getDailySales(): Promise<{ date: string; amount: number }[]>;
  getTopProducts(): Promise<{ name: string; quantity: number }[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Products
  async getProducts(search?: string, category?: string): Promise<Product[]> {
    let query = db.select().from(products);

    const filters = [];
    if (search) {
      filters.push(like(products.name, `%${search}%`));
    }
    if (category) {
      filters.push(eq(products.category, category));
    }

    if (filters.length > 0) {
      // @ts-ignore - AND logic is simple enough here
      return await query.where(and(...filters));
    }

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    if (search) {
      return await db.select().from(customers).where(like(customers.name, `%${search}%`));
    }
    return await db.select().from(customers);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  // Bills
  async createBill(data: CreateBillRequest, cashierId: number): Promise<Bill> {
    return await db.transaction(async (tx) => {
      // 1. Calculate totals and validate stock
      let subtotal = 0;
      let taxTotal = 0;
      const finalItems = [];

      for (const item of data.items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const price = Number(product.sellingPrice);
        const taxRate = Number(product.taxRate);
        const lineTotal = price * item.quantity;
        const lineTax = (lineTotal * taxRate) / 100;

        subtotal += lineTotal;
        taxTotal += lineTax;

        // Decrement stock
        await tx.update(products)
          .set({ stockQuantity: product.stockQuantity - item.quantity })
          .where(eq(products.id, item.productId));

        finalItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.sellingPrice,
          tax: lineTax.toString()
        });
      }

      const discountAmount = data.discountAmount || 0;
      const grandTotal = subtotal + taxTotal - discountAmount;
      const billNumber = `INV-${Date.now()}`;

      // 2. Create Bill
      const [bill] = await tx.insert(bills).values({
        billNumber,
        subtotal: subtotal.toString(),
        taxTotal: taxTotal.toString(),
        discountTotal: discountAmount.toString(),
        grandTotal: grandTotal.toString(),
        paymentMode: data.paymentMode,
        customerId: data.customerId,
        cashierId: cashierId,
      }).returning();

      // 3. Create Bill Items
      for (const item of finalItems) {
        await tx.insert(billItems).values({
          billId: bill.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax,
        });
      }

      // 4. Update Customer Loyalty (Simple: 1 point per 100 currency units in INR)
      if (data.customerId) {
        const points = Math.floor(grandTotal / 100);
        await tx.execute(sql`
          UPDATE customers 
          SET loyalty_points = loyalty_points + ${points}
          WHERE id = ${data.customerId}
        `);
      }

      return bill;
    });
  }

  async getBills(): Promise<Bill[]> {
    return await db.select().from(bills).orderBy(desc(bills.date));
  }

  async getBillByPublicId(publicId: string): Promise<{ bill: Bill; items: any[] } | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.publicId, publicId));
    if (!bill) return undefined;

    const items = await db.select({
      id: billItems.id,
      billId: billItems.billId,
      productId: billItems.productId,
      quantity: billItems.quantity,
      price: billItems.price,
      tax: billItems.tax,
      product: products,
    })
      .from(billItems)
      .innerJoin(products, eq(billItems.productId, products.id))
      .where(eq(billItems.billId, bill.id));

    return { bill, items };
  }

  // Stats
  async getDailySales(): Promise<{ date: string; amount: number }[]> {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        SUM(grand_total) as amount
      FROM bills
      GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
      ORDER BY date DESC
      LIMIT 7
    `);
    return result.rows.map((row: any) => ({
      date: row.date,
      amount: Number(row.amount)
    }));
  }

  async getTopProducts(): Promise<{ name: string; quantity: number }[]> {
    const result = await db.execute(sql`
      SELECT 
        p.name,
        SUM(bi.quantity) as quantity
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.id
      GROUP BY p.name
      ORDER BY quantity DESC
      LIMIT 5
    `);
    return result.rows.map((row: any) => ({
      name: row.name,
      quantity: Number(row.quantity)
    }));
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return await db.select().from(products).where(lt(products.stockQuantity, threshold));
  }
}

export const storage = new DatabaseStorage();
