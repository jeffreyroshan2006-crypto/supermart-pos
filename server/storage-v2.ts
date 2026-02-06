import { db } from "./db";
import {
  organizations, stores, users, userStores,
  categories, brands, units, suppliers, products, customers,
  purchaseOrders, purchaseOrderItems, stockAdjustments,
  bills, billItems, billPayments, heldBills,
  offers, loyaltyTransactions, storeSettings, activityLogs,
  InsertOrganization, InsertStore, InsertUser, InsertUserStore,
  InsertCategory, InsertBrand, InsertUnit, InsertSupplier,
  InsertProduct, InsertCustomer, InsertPurchaseOrder, InsertStockAdjustment,
  InsertBill, CreateBillRequest,
} from "../shared/schema";
import { eq, and, like, desc, asc, gte, lte, sql, inArray } from "drizzle-orm";

// ============================================
// ORGANIZATION OPERATIONS
// ============================================

export async function createOrganization(data: InsertOrganization) {
  const [org] = await db.insert(organizations).values(data).returning();
  return org;
}

export async function getOrganization(id: number) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  return org;
}

// ============================================
// STORE OPERATIONS
// ============================================

export async function createStore(data: InsertStore) {
  const [store] = await db.insert(stores).values(data).returning();
  
  // Create default settings for the store
  await db.insert(storeSettings).values({
    storeId: store.id,
  });
  
  return store;
}

export async function getStore(id: number) {
  const [store] = await db.select().from(stores).where(eq(stores.id, id));
  return store;
}

export async function getStoresByOrganization(organizationId: number) {
  return db.select().from(stores).where(eq(stores.organizationId, organizationId));
}

export async function getUserStores(userId: number) {
  const userStoreRelations = await db
    .select({ storeId: userStores.storeId, isDefault: userStores.isDefault })
    .from(userStores)
    .where(eq(userStores.userId, userId));
  
  if (userStoreRelations.length === 0) {
    // Return all stores from user's organization
    const userData = await getUser(userId);
    if (userData) {
      return getStoresByOrganization(userData.organizationId);
    }
    return [];
  }
  
  const storeIds = userStoreRelations.map(r => r.storeId);
  return db.select().from(stores).where(inArray(stores.id, storeIds));
}

// ============================================
// USER OPERATIONS
// ============================================

export async function createUser(data: InsertUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function getUser(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUsersByOrganization(organizationId: number) {
  return db.select().from(users).where(eq(users.organizationId, organizationId));
}

export async function updateUserDefaultStore(userId: number, storeId: number) {
  const [user] = await db
    .update(users)
    .set({ defaultStoreId: storeId })
    .where(eq(users.id, userId))
    .returning();
  return user;
}

// ============================================
// CATEGORY OPERATIONS
// ============================================

export async function createCategory(data: InsertCategory) {
  const [category] = await db.insert(categories).values(data).returning();
  return category;
}

export async function getCategoriesByOrganization(organizationId: number) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.organizationId, organizationId))
    .orderBy(asc(categories.sortOrder));
}

// ============================================
// BRAND OPERATIONS
// ============================================

export async function createBrand(data: InsertBrand) {
  const [brand] = await db.insert(brands).values(data).returning();
  return brand;
}

export async function getBrandsByOrganization(organizationId: number) {
  return db
    .select()
    .from(brands)
    .where(eq(brands.organizationId, organizationId))
    .orderBy(asc(brands.name));
}

// ============================================
// UNIT OPERATIONS
// ============================================

export async function createUnit(data: InsertUnit) {
  const [unit] = await db.insert(units).values(data).returning();
  return unit;
}

export async function getUnitsByOrganization(organizationId: number) {
  return db
    .select()
    .from(units)
    .where(eq(units.organizationId, organizationId))
    .orderBy(asc(units.name));
}

// ============================================
// SUPPLIER OPERATIONS
// ============================================

export async function createSupplier(data: InsertSupplier) {
  const [supplier] = await db.insert(suppliers).values(data).returning();
  return supplier;
}

export async function getSuppliersByOrganization(organizationId: number) {
  return db
    .select()
    .from(suppliers)
    .where(eq(suppliers.organizationId, organizationId))
    .orderBy(asc(suppliers.name));
}

// ============================================
// PRODUCT OPERATIONS
// ============================================

export async function createProduct(data: InsertProduct) {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}

export async function getProduct(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  return product;
}

export async function getProductsByStore(
  storeId: number,
  filters?: { search?: string; category?: number; brand?: number; lowStock?: boolean }
) {
  let query = db.select().from(products).where(eq(products.storeId, storeId));
  
  if (filters?.search) {
    query = query.where(
      or(
        like(products.name, `%${filters.search}%`),
        like(products.sku, `%${filters.search}%`),
        like(products.barcode, `%${filters.search}%`)
      )
    );
  }
  
  if (filters?.category) {
    query = query.where(eq(products.categoryId, filters.category));
  }
  
  if (filters?.brand) {
    query = query.where(eq(products.brandId, filters.brand));
  }
  
  if (filters?.lowStock) {
    query = query.where(sql`${products.stockQuantity} <= ${products.minStockLevel}`);
  }
  
  return query.orderBy(asc(products.name));
}

export async function searchProducts(query: string, storeId: number) {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        or(
          like(products.name, `%${query}%`),
          like(products.sku, `%${query}%`),
          like(products.barcode, `%${query}%`)
        )
      )
    )
    .limit(20);
}

export async function searchProductByBarcode(barcode: string, storeId: number) {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        or(
          eq(products.sku, barcode),
          eq(products.barcode, barcode)
        )
      )
    );
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const [product] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return product;
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

export async function createCustomer(data: InsertCustomer) {
  const [customer] = await db.insert(customers).values(data).returning();
  return customer;
}

export async function getCustomer(id: number) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  return customer;
}

export async function getCustomersByOrganization(
  organizationId: number,
  filters?: { search?: string; storeId?: number }
) {
  let query = db.select().from(customers).where(eq(customers.organizationId, organizationId));
  
  if (filters?.search) {
    query = query.where(
      or(
        like(customers.name, `%${filters.search}%`),
        like(customers.phone, `%${filters.search}%`),
        like(customers.email, `%${filters.search}%`)
      )
    );
  }
  
  if (filters?.storeId) {
    query = query.where(eq(customers.storeId, filters.storeId));
  }
  
  return query.orderBy(asc(customers.name));
}

export async function searchCustomers(query: string, organizationId: number) {
  return db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        or(
          like(customers.name, `%${query}%`),
          like(customers.phone, `%${query}%`)
        )
      )
    )
    .limit(20);
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const [customer] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return customer;
}

// ============================================
// BILL OPERATIONS
// ============================================

export async function createBill(data: CreateBillRequest & { organizationId: number; storeId: number; cashierId: number }) {
  // Start a transaction
  return await db.transaction(async (tx) => {
    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    
    // Validate stock and calculate
    for (const item of data.items) {
      const product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product[0]) throw new Error(`Product ${item.productId} not found`);
      
      const productData = product[0];
      if (productData.isTrackInventory && Number(productData.stockQuantity) < item.quantity) {
        if (!productData.allowNegativeStock) {
          throw new Error(`Insufficient stock for ${productData.name}`);
        }
      }
      
      const itemTotal = item.price * item.quantity;
      const discountAmount = (itemTotal * (item.discountPercent || 0)) / 100;
      const taxableAmount = itemTotal - discountAmount;
      const gstRate = Number(productData.gstRate || 0);
      const taxAmount = (taxableAmount * gstRate) / 100;
      
      subtotal += itemTotal;
      taxTotal += taxAmount;
      cgstTotal += taxAmount / 2;
      sgstTotal += taxAmount / 2;
    }
    
    const itemDiscountTotal = data.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + (itemTotal * (item.discountPercent || 0)) / 100;
    }, 0);
    
    const grandTotal = subtotal - itemDiscountTotal - (data.billDiscountAmount || 0) + taxTotal;
    
    // Create bill
    const [bill] = await tx.insert(bills).values({
      organizationId: data.organizationId,
      storeId: data.storeId,
      cashierId: data.cashierId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      subtotal: subtotal.toString(),
      itemDiscountTotal: itemDiscountTotal.toString(),
      billDiscountAmount: (data.billDiscountAmount || 0).toString(),
      billDiscountPercent: (data.billDiscountPercent || 0).toString(),
      taxTotal: taxTotal.toString(),
      cgstTotal: cgstTotal.toString(),
      sgstTotal: sgstTotal.toString(),
      grandTotal: Math.round(grandTotal).toString(),
      paymentMode: data.paymentMode,
      loyaltyPointsRedeemed: data.loyaltyPointsRedeemed || 0,
      notes: data.notes,
      status: 'completed',
      completedAt: new Date(),
    }).returning();
    
    // Create bill items
    for (const item of data.items) {
      const product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
      const productData = product[0];
      
      const itemTotal = item.price * item.quantity;
      const discountAmount = (itemTotal * (item.discountPercent || 0)) / 100;
      const taxableAmount = itemTotal - discountAmount;
      const gstRate = Number(productData.gstRate || 0);
      const taxAmount = (taxableAmount * gstRate) / 100;
      
      await tx.insert(billItems).values({
        billId: bill.id,
        productId: item.productId,
        productName: productData.name,
        productSku: productData.sku,
        hsnCode: productData.hsnCode,
        quantity: item.quantity.toString(),
        unit: 'PCS', // Get from unit table
        mrp: productData.mrp,
        sellingPrice: item.price.toString(),
        discountPercent: (item.discountPercent || 0).toString(),
        discountAmount: discountAmount.toString(),
        gstRate: gstRate.toString(),
        taxableAmount: taxableAmount.toString(),
        cgstAmount: (taxAmount / 2).toString(),
        sgstAmount: (taxAmount / 2).toString(),
        totalAmount: (taxableAmount + taxAmount).toString(),
      });
      
      // Update stock
      if (productData.isTrackInventory) {
        await tx
          .update(products)
          .set({ 
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` 
          })
          .where(eq(products.id, item.productId));
      }
    }
    
    // Create payments
    if (data.payments && data.payments.length > 0) {
      for (const payment of data.payments) {
        await tx.insert(billPayments).values({
          billId: bill.id,
          paymentMode: payment.mode as any,
          amount: payment.amount.toString(),
          referenceNumber: payment.reference,
        });
      }
    }
    
    // Update customer loyalty and purchase stats
    if (data.customerId) {
      await tx
        .update(customers)
        .set({
          totalPurchaseAmount: sql`${customers.totalPurchaseAmount} + ${Math.round(grandTotal)}`,
          visitCount: sql`${customers.visitCount} + 1`,
          loyaltyPoints: sql`${customers.loyaltyPoints} - ${data.loyaltyPointsRedeemed || 0}`,
        })
        .where(eq(customers.id, data.customerId));
    }
    
    return bill;
  });
}

export async function getBillWithItems(id: number) {
  const [bill] = await db.select().from(bills).where(eq(bills.id, id));
  if (!bill) return null;
  
  const items = await db.select().from(billItems).where(eq(billItems.billId, id));
  const payments = await db.select().from(billPayments).where(eq(billPayments.billId, id));
  
  return { ...bill, items, payments };
}

export async function getBillsByOrganization(
  organizationId: number,
  filters?: { storeId?: number; startDate?: string; endDate?: string; status?: string; limit?: number; offset?: number }
) {
  let query = db.select().from(bills).where(eq(bills.organizationId, organizationId));
  
  if (filters?.storeId) {
    query = query.where(eq(bills.storeId, filters.storeId));
  }
  
  if (filters?.status) {
    query = query.where(eq(bills.status, filters.status as any));
  }
  
  if (filters?.startDate) {
    query = query.where(gte(bills.billDate, new Date(filters.startDate)));
  }
  
  if (filters?.endDate) {
    query = query.where(lte(bills.billDate, new Date(filters.endDate)));
  }
  
  return query
    .orderBy(desc(bills.billDate))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
}

export async function cancelBill(id: number, cancelledBy: number, reason?: string) {
  const [bill] = await db
    .update(bills)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: reason,
    })
    .where(eq(bills.id, id))
    .returning();
  return bill;
}

export async function getBillByPublicId(publicId: string) {
  const [bill] = await db.select().from(bills).where(eq(bills.publicId, publicId));
  if (!bill) return null;
  
  const items = await db.select().from(billItems).where(eq(billItems.billId, bill.id));
  return { ...bill, items };
}

// ============================================
// HELD BILL OPERATIONS
// ============================================

export async function createHeldBill(data: any) {
  const [heldBill] = await db.insert(heldBills).values({
    ...data,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }).returning();
  return heldBill;
}

export async function getHeldBillsByStore(storeId: number) {
  return db
    .select()
    .from(heldBills)
    .where(
      and(
        eq(heldBills.storeId, storeId),
        sql`${heldBills.expiresAt} > NOW()`,
        sql`${heldBills.resumedAt} IS NULL`
      )
    )
    .orderBy(desc(heldBills.heldAt));
}

export async function resumeHeldBill(id: number) {
  const [heldBill] = await db
    .update(heldBills)
    .set({ resumedAt: new Date() })
    .where(eq(heldBills.id, id))
    .returning();
  return heldBill;
}

export async function deleteHeldBill(id: number) {
  await db.delete(heldBills).where(eq(heldBills.id, id));
}

// ============================================
// REPORT OPERATIONS
// ============================================

export async function getSalesSummary(params: { startDate: string; endDate: string; storeId: number }) {
  const result = await db.execute(sql`
    SELECT 
      DATE(bill_date) as date,
      COUNT(*) as total_bills,
      SUM(subtotal) as total_subtotal,
      SUM(tax_total) as total_tax,
      SUM(grand_total) as total_sales,
      SUM(CASE WHEN payment_mode = 'cash' THEN grand_total ELSE 0 END) as cash_sales,
      SUM(CASE WHEN payment_mode = 'upi' THEN grand_total ELSE 0 END) as upi_sales,
      SUM(CASE WHEN payment_mode = 'card' THEN grand_total ELSE 0 END) as card_sales
    FROM bills
    WHERE store_id = ${params.storeId}
      AND status = 'completed'
      AND DATE(bill_date) BETWEEN ${params.startDate} AND ${params.endDate}
    GROUP BY DATE(bill_date)
    ORDER BY date DESC
  `);
  return result.rows;
}

export async function getTopSellingProducts(params: { days: number; storeId: number }) {
  const result = await db.execute(sql`
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
    WHERE b.store_id = ${params.storeId}
      AND b.status = 'completed'
      AND b.bill_date >= NOW() - INTERVAL '${params.days} days'
    GROUP BY p.id, p.name, p.sku, c.name
    ORDER BY total_quantity_sold DESC
    LIMIT 20
  `);
  return result.rows;
}

export async function getGstSummary(params: { startDate: string; endDate: string; storeId: number }) {
  const result = await db.execute(sql`
    SELECT 
      DATE(bill_date) as date,
      SUM(cgst_total) as total_cgst,
      SUM(sgst_total) as total_sgst,
      SUM(igst_total) as total_igst,
      SUM(tax_total) as total_tax,
      SUM(subtotal) as taxable_value
    FROM bills
    WHERE store_id = ${params.storeId}
      AND status = 'completed'
      AND DATE(bill_date) BETWEEN ${params.startDate} AND ${params.endDate}
    GROUP BY DATE(bill_date)
    ORDER BY date DESC
  `);
  return result.rows;
}

export async function getLowStockProducts(storeId: number) {
  return db
    .select({
      product: products,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        eq(products.isTrackInventory, true),
        sql`${products.stockQuantity} <= ${products.minStockLevel}`
      )
    );
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

export async function getStoreSettings(storeId: number) {
  const [settings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.storeId, storeId));
  return settings;
}

export async function updateStoreSettings(storeId: number, data: any) {
  const [settings] = await db
    .update(storeSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(storeSettings.storeId, storeId))
    .returning();
  return settings;
}

// ============================================
// PURCHASE ORDER OPERATIONS
// ============================================

export async function createPurchaseOrder(data: InsertPurchaseOrder) {
  const [order] = await db.insert(purchaseOrders).values(data).returning();
  return order;
}

export async function getPurchaseOrdersByStore(storeId: number) {
  return db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.storeId, storeId))
    .orderBy(desc(purchaseOrders.orderDate));
}

export async function receivePurchaseOrder(id: number, items: { productId: number; receivedQuantity: number }[]) {
  return await db.transaction(async (tx) => {
    // Update order status
    const [order] = await tx
      .update(purchaseOrders)
      .set({ status: 'received', receivedDate: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    
    // Update stock
    for (const item of items) {
      await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} + ${item.receivedQuantity}`,
        })
        .where(eq(products.id, item.productId));
    }
    
    return order;
  });
}

// ============================================
// STOCK ADJUSTMENT OPERATIONS
// ============================================

export async function createStockAdjustment(data: InsertStockAdjustment) {
  return await db.transaction(async (tx) => {
    // Create adjustment record
    const [adjustment] = await tx.insert(stockAdjustments).values(data).returning();
    
    // Update product stock
    await tx
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} + ${data.quantity}`,
      })
      .where(eq(products.id, data.productId));
    
    return adjustment;
  });
}

export async function getStockAdjustmentsByStore(storeId: number) {
  return db
    .select()
    .from(stockAdjustments)
    .where(eq(stockAdjustments.storeId, storeId))
    .orderBy(desc(stockAdjustments.createdAt));
}

// Helper function
function or(...conditions: any[]) {
  return sql`(${conditions.join(' OR ')})`;
}
