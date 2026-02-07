import "dotenv/config";
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
    users, products, suppliers, customers, categories, units,
    organizations, stores, userStores, storeSettings, brands
} from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
    console.log("🌱 Starting comprehensive database seeding for Indian Retail...\n");

    try {
        // ============================================
        // 1. CREATE ORGANIZATION
        // ============================================
        console.log("🏢 Setting up organization...");
        let [org] = await db.insert(organizations).values({
            name: "SuperMart India",
            slug: "supermart-india",
            email: "admin@supermart.in",
            phone: "+91 80 1234 5678",
            address: "123 MG Road, Bangalore, Karnataka 560001",
            gstin: "29AABCU9603R1ZX",
            isActive: true,
        }).onConflictDoNothing().returning();

        if (!org) {
            [org] = await db.select().from(organizations).where(eq(organizations.slug, "supermart-india")).limit(1);
        }
        const organizationId = org.id;
        console.log(`✅ Organization: ${org.name} (ID: ${organizationId})\n`);

        // ============================================
        // 2. CREATE STORE
        // ============================================
        console.log("🏪 Setting up store...");
        let [store] = await db.insert(stores).values({
            organizationId,
            name: "Main Branch - Bangalore",
            code: "MAIN",
            address: "123 MG Road, Bangalore",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001",
            phone: "+91 80 1234 5678",
            email: "bangalore@supermart.in",
            gstin: "29AABCU9603R1ZX",
            isActive: true,
            isPrimary: true,
        }).onConflictDoNothing().returning();

        if (!store) {
            [store] = await db.select().from(stores).where(eq(stores.code, "MAIN")).limit(1);
        }
        const storeId = store.id;
        console.log(`✅ Store: ${store.name} (ID: ${storeId})\n`);

        // ============================================
        // 3. CREATE ADMIN USER
        // ============================================
        console.log("👤 Creating admin user...");
        const hashedPassword = await hashPassword("admin123");

        let [adminUser] = await db.insert(users).values({
            organizationId,
            email: "admin@supermart.in",
            password: hashedPassword,
            role: "admin",
            status: "active",
            name: "Store Administrator",
            phone: "+91 98765 43210",
            defaultStoreId: storeId,
        }).onConflictDoNothing().returning();

        if (!adminUser) {
            [adminUser] = await db.select().from(users).where(eq(users.email, "admin@supermart.in")).limit(1);
        }
        const userId = adminUser.id;

        // Link user to store
        await db.insert(userStores).values({
            userId,
            storeId,
            isDefault: true,
        }).onConflictDoNothing();

        console.log("✅ Admin user created: admin@supermart.in / admin123\n");

        // ============================================
        // 4. CREATE STORE SETTINGS
        // ============================================
        console.log("⚙️  Setting up store configuration...");
        await db.insert(storeSettings).values({
            storeId,
            invoicePrefix: "SM",
            invoiceSuffix: "BLR",
            nextInvoiceNumber: 1,
            invoiceFooter: "Thank you for shopping with SuperMart!\nGST Reg: 29AABCU9603R1ZX\nVisit us: www.supermart.in",
            invoiceTerms: "Goods once sold will not be taken back.\nExchange within 7 days with bill.",
            printReceiptOnComplete: true,
            showLogoOnReceipt: true,
            receiptWidth: "80mm",
            defaultGstRate: "18",
            priceTaxInclusive: true,
            currencyCode: "INR",
            currencySymbol: "₹",
            loyaltyEnabled: true,
            loyaltyPointsPerRupee: "1",
            loyaltyRedemptionValue: "1",
            counterName: "Counter 1",
        }).onConflictDoNothing();
        console.log("✅ Store settings configured\n");

        // ============================================
        // 5. CREATE CATEGORIES
        // ============================================
        console.log("📂 Creating product categories...");
        const categoriesData = [
            { name: "Groceries", description: "Daily groceries and staples", color: "#22c55e", icon: "shopping-basket" },
            { name: "Dairy & Eggs", description: "Milk, curd, cheese, eggs", color: "#3b82f6", icon: "milk" },
            { name: "Beverages", description: "Tea, coffee, soft drinks, juices", color: "#f59e0b", icon: "coffee" },
            { name: "Snacks", description: "Chips, biscuits, namkeen", color: "#ef4444", icon: "cookie" },
            { name: "Personal Care", description: "Soap, shampoo, cosmetics", color: "#8b5cf6", icon: "sparkles" },
            { name: "Household", description: "Cleaning supplies, detergents", color: "#06b6d4", icon: "home" },
            { name: "Electronics", description: "Mobile accessories, batteries", color: "#6366f1", icon: "smartphone" },
            { name: "Stationery", description: "Pens, notebooks, office supplies", color: "#ec4899", icon: "pen-tool" },
            { name: "Baby Care", description: "Diapers, baby food, wipes", color: "#f97316", icon: "baby" },
            { name: "Rice & Grains", description: "Basmati rice, pulses, dal", color: "#eab308", icon: "wheat" },
            { name: "Spices & Masala", description: "Indian spices, masala powders", color: "#dc2626", icon: "flame" },
            { name: "Oil & Ghee", description: "Cooking oil, mustard oil, ghee", color: "#fbbf24", icon: "droplet" },
        ];

        const categoryMap = new Map<string, number>();
        for (const cat of categoriesData) {
            let [newCat] = await db.insert(categories).values({
                organizationId,
                ...cat,
                sortOrder: categoriesData.indexOf(cat),
                isActive: true,
            }).onConflictDoNothing().returning();

            if (!newCat) {
                [newCat] = await db.select().from(categories).where(eq(categories.name, cat.name)).limit(1);
            }
            categoryMap.set(cat.name, newCat.id);
        }
        console.log(`✅ Created ${categoriesData.length} categories\n`);

        // ============================================
        // 6. CREATE UNITS
        // ============================================
        console.log("📏 Creating units of measurement...");
        const unitsData = [
            { name: "Piece", code: "PCS" },
            { name: "Kilogram", code: "KG" },
            { name: "Gram", code: "GM" },
            { name: "Liter", code: "LTR" },
            { name: "Milliliter", code: "ML" },
            { name: "Pack", code: "PACK" },
            { name: "Box", code: "BOX" },
            { name: "Dozen", code: "DZ" },
            { name: "Meter", code: "MTR" },
            { name: "Pouch", code: "PCH" },
        ];

        const unitMap = new Map<string, number>();
        for (const unit of unitsData) {
            let [newUnit] = await db.insert(units).values({
                organizationId,
                ...unit,
                isActive: true,
            }).onConflictDoNothing().returning();

            if (!newUnit) {
                [newUnit] = await db.select().from(units).where(eq(units.code, unit.code)).limit(1);
            }
            unitMap.set(unit.code, newUnit.id);
        }
        console.log(`✅ Created ${unitsData.length} units\n`);

        // ============================================
        // 7. CREATE BRANDS
        // ============================================
        console.log("🏷️  Creating brands...");
        const brandsData = [
            "HUL", "Nestle", "Amul", "ITC", "Dabur", "Britannia", "Marico", "Tata", "Fortune", "Aashirvaad", "Pepsico", "Coca Cola"
        ];
        const brandMap = new Map<string, number>();
        for (const brandName of brandsData) {
            let [newBrand] = await db.insert(brands).values({
                organizationId,
                name: brandName,
                isActive: true,
            }).onConflictDoNothing().returning();

            if (!newBrand) {
                [newBrand] = await db.select().from(brands).where(eq(brands.name, brandName)).limit(1);
            }
            brandMap.set(brandName, newBrand.id);
        }
        console.log(`✅ Created ${brandsData.length} brands\n`);

        // ============================================
        // 8. CREATE SUPPLIERS
        // ============================================
        console.log("🏭 Creating suppliers...");
        const suppliersData = [
            { name: "HUL India Ltd", contactPerson: "Rajesh Kumar", phone: "+91 80 4000 1000", email: "orders@hul.co.in", gstin: "29AAACH1234R1Z5", address: "HUL House, Bannerghatta Road, Bangalore" },
            { name: "Nestle India", contactPerson: "Priya Sharma", phone: "+91 80 4110 2000", email: "supply@nestle.in", gstin: "29AAACN1234R1Z6", address: "Nestle House, Infantry Road, Bangalore" },
            { name: "Amul Dairy", contactPerson: "Suresh Patel", phone: "+91 79 2685 0100", email: "orders@amul.coop", gstin: "24AAACA1234R1Z7", address: "Amul Dairy Road, Anand, Gujarat" },
            { name: "ITC Foods", contactPerson: "Anita Reddy", phone: "+91 80 2833 4000", email: "supply@itc.in", gstin: "29AAACI1234R1Z8", address: "ITC Centre, Residency Road, Bangalore" },
            { name: "Dabur India", contactPerson: "Vikram Singh", phone: "+91 11 2768 1000", email: "orders@dabur.com", gstin: "07AAACD1234R1Z9", address: "Dabur House, Sahibabad, Ghaziabad" },
            { name: "Britannia Industries", contactPerson: "Meera Iyer", phone: "+91 80 2852 1000", email: "supply@britannia.co.in", gstin: "29AAACB1234R1Z0", address: "Britannia Tower, Airport Road, Bangalore" },
            { name: "Marico Ltd", contactPerson: "Arun Nair", phone: "+91 22 2685 0000", email: "orders@marico.com", gstin: "27AAACM1234R1Z1", address: "Marico House, Bandra, Mumbai" },
            { name: "Tata Consumer Products", contactPerson: "Deepa Joshi", phone: "+91 80 6718 1000", email: "supply@tataconsumer.com", gstin: "29AAACT1234R1Z2", address: "Tata Coffee Building, Bangalore" },
        ];

        for (const supplier of suppliersData) {
            await db.insert(suppliers).values({
                organizationId,
                ...supplier,
                city: supplier.address.split(", ").pop()?.split(" ")[0] || "",
                state: supplier.gstin.substring(0, 2) === "29" ? "Karnataka" :
                    supplier.gstin.substring(0, 2) === "24" ? "Gujarat" :
                        supplier.gstin.substring(0, 2) === "07" ? "Delhi" :
                            supplier.gstin.substring(0, 2) === "27" ? "Maharashtra" : "Other",
                isActive: true,
            }).onConflictDoNothing();
        }
        console.log(`✅ Created ${suppliersData.length} suppliers\n`);

        // Get supplier IDs
        const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.organizationId, organizationId));
        const supplierIds = allSuppliers.map(s => s.id);

        // ============================================
        // 9. CREATE INDIAN PRODUCTS
        // ============================================
        console.log("🛍️  Creating Indian products catalog...");

        const indianProducts = [
            // GROCERIES
            { name: "India Gate Basmati Rice 5kg", category: "Rice & Grains", brand: "Fortune", sku: "RICE001", unit: "KG", mrp: 520, purchasePrice: 420, sellingPrice: 485, gstRate: 5, stock: 50, minStock: 10, hsn: "1006" },
            { name: "Daawat Rozana Gold 1kg", category: "Rice & Grains", brand: "Fortune", sku: "RICE002", unit: "KG", mrp: 95, purchasePrice: 75, sellingPrice: 88, gstRate: 5, stock: 100, minStock: 20, hsn: "1006" },
            { name: "Aashirvaad Atta 5kg", category: "Groceries", brand: "Aashirvaad", sku: "ATTA001", unit: "KG", mrp: 245, purchasePrice: 195, sellingPrice: 225, gstRate: 0, stock: 80, minStock: 15, hsn: "1101" },
            { name: "Pillsbury Chakki Fresh Atta 10kg", category: "Groceries", brand: "Fortune", sku: "ATTA002", unit: "KG", mrp: 450, purchasePrice: 380, sellingPrice: 425, gstRate: 0, stock: 40, minStock: 10, hsn: "1101" },
            { name: "Fortune Maida 1kg", category: "Groceries", brand: "Fortune", sku: "MAIDA001", unit: "KG", mrp: 55, purchasePrice: 42, sellingPrice: 50, gstRate: 0, stock: 60, minStock: 15, hsn: "1101" },

            // DAIRY
            { name: "Amul Taaza Milk 1L", category: "Dairy & Eggs", brand: "Amul", sku: "MILK001", unit: "LTR", mrp: 72, purchasePrice: 58, sellingPrice: 68, gstRate: 0, stock: 200, minStock: 50, hsn: "0401" },
            { name: "Amul Gold Milk 500ml", category: "Dairy & Eggs", brand: "Amul", sku: "MILK002", unit: "ML", mrp: 40, purchasePrice: 32, sellingPrice: 38, gstRate: 0, stock: 150, minStock: 40, hsn: "0401" },
            { name: "Amul Butter 500g", category: "Dairy & Eggs", brand: "Amul", sku: "BUTTER001", unit: "GM", mrp: 275, purchasePrice: 225, sellingPrice: 260, gstRate: 12, stock: 40, minStock: 10, hsn: "0405" },
            { name: "Amul Cheese Slices 200g", category: "Dairy & Eggs", brand: "Amul", sku: "CHEESE001", unit: "GM", mrp: 135, purchasePrice: 108, sellingPrice: 125, gstRate: 12, stock: 35, minStock: 8, hsn: "0406" },
            { name: "Amul Paneer 200g", category: "Dairy & Eggs", brand: "Amul", sku: "PANEER001", unit: "GM", mrp: 95, purchasePrice: 75, sellingPrice: 88, gstRate: 0, stock: 45, minStock: 10, hsn: "0406" },

            // SNACKS
            { name: "Lay's Classic Salted 52g", category: "Snacks", brand: "Pepsico", sku: "CHIPS001", unit: "GM", mrp: 20, purchasePrice: 15, sellingPrice: 18, gstRate: 12, stock: 150, minStock: 40, hsn: "1905" },
            { name: "Britannia Good Day Cashew 72g", category: "Snacks", brand: "Britannia", sku: "BISCUIT001", unit: "GM", mrp: 25, purchasePrice: 19, sellingPrice: 22, gstRate: 18, stock: 120, minStock: 30, hsn: "1905" },

            // BEVERAGES
            { name: "Tata Tea Gold 250g", category: "Beverages", brand: "Tata", sku: "TEA001", unit: "GM", mrp: 165, purchasePrice: 132, sellingPrice: 152, gstRate: 5, stock: 50, minStock: 12, hsn: "0902" },
            { name: "Coca-Cola 750ml", category: "Beverages", brand: "Coca Cola", sku: "COLDDRINK001", unit: "ML", mrp: 40, purchasePrice: 32, sellingPrice: 37, gstRate: 28, stock: 100, minStock: 25, hsn: "2202" },
        ];

        // Insert products
        let productCount = 0;
        for (const product of indianProducts) {
            await db.insert(products).values({
                organizationId,
                storeId,
                name: product.name,
                categoryId: categoryMap.get(product.category),
                brandId: brandMap.get(product.brand),
                sku: product.sku,
                unitId: unitMap.get(product.unit),
                mrp: product.mrp.toString(),
                purchasePrice: product.purchasePrice.toString(),
                sellingPrice: product.sellingPrice.toString(),
                gstRate: product.gstRate.toString(),
                stockQuantity: product.stock.toString(),
                minStockLevel: product.minStock.toString(),
                hsnCode: product.hsn,
                supplierId: supplierIds[productCount % supplierIds.length],
                isActive: true,
                isTrackInventory: true,
            }).onConflictDoNothing();
            productCount++;
        }
        console.log(`✅ Created ${productCount} Indian products\n`);

        // ============================================
        // 10. CREATE SAMPLE CUSTOMERS
        // ============================================
        console.log("👥 Creating customers...");
        const customersData = [
            { name: "Walk-in Customer", phone: "0000000000", email: "", loyaltyPoints: 0 },
            { name: "Rajesh Kumar", phone: "+91 98765 12345", email: "rajesh@example.com", loyaltyPoints: 150 },
            { name: "Priya Sharma", phone: "+91 98765 23456", email: "priya@example.com", loyaltyPoints: 320 },
        ];

        for (const customer of customersData) {
            await db.insert(customers).values({
                organizationId,
                storeId,
                ...customer,
                isActive: true,
            }).onConflictDoNothing();
        }
        console.log(`✅ Created ${customersData.length} customers\n`);

        console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    } catch (error) {
        console.error("\n❌ Error seeding database:", error);
        throw error;
    } finally {
        process.exit(0);
    }
}

seed();
