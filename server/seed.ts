import "dotenv/config";
import { db } from "./db";
import { 
  users, products, suppliers, customers, categories, units,
  organizations, stores, userStores, storeSettings
} from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
    console.log("🌱 Starting comprehensive database seeding for Indian Retail...\n");

    try {
        // ============================================
        // 1. CREATE ORGANIZATION
        // ============================================
        console.log("🏢 Setting up organization...");
        const [org] = await db.insert(organizations).values({
            name: "SuperMart India",
            slug: "supermart-india",
            email: "admin@supermart.in",
            phone: "+91 80 1234 5678",
            address: "123 MG Road, Bangalore, Karnataka 560001",
            gstin: "29AABCU9603R1ZX",
            isActive: true,
        }).onConflictDoNothing().returning();

        const organizationId = org?.id || 1;
        console.log("✅ Organization created/updated\n");

        // ============================================
        // 2. CREATE STORE
        // ============================================
        console.log("🏪 Setting up store...");
        const [store] = await db.insert(stores).values({
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

        const storeId = store?.id || 1;
        console.log("✅ Store created/updated\n");

        // ============================================
        // 3. CREATE ADMIN USER
        // ============================================
        console.log("👤 Creating admin user...");
        const hashedPassword = await hashPassword("admin123");

        const [adminUser] = await db.insert(users).values({
            organizationId,
            email: "admin@supermart.in",
            password: hashedPassword,
            role: "admin",
            status: "active",
            name: "Store Administrator",
            phone: "+91 98765 43210",
            defaultStoreId: storeId,
        }).onConflictDoNothing().returning();

        const userId = adminUser?.id || 1;

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

        for (const cat of categoriesData) {
            await db.insert(categories).values({
                organizationId,
                ...cat,
                sortOrder: categoriesData.indexOf(cat),
                isActive: true,
            }).onConflictDoNothing();
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

        for (const unit of unitsData) {
            await db.insert(units).values({
                organizationId,
                ...unit,
                isActive: true,
            }).onConflictDoNothing();
        }
        console.log(`✅ Created ${unitsData.length} units\n`);

        // ============================================
        // 7. CREATE SUPPLIERS
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
        const allSuppliers = await db.select().from(suppliers).where({ organizationId });
        const supplierIds = allSuppliers.map(s => s.id);

        // ============================================
        // 8. CREATE INDIAN PRODUCTS
        // ============================================
        console.log("🛍️  Creating Indian products catalog...");
        
        const indianProducts = [
            // GROCERIES
            { name: "India Gate Basmati Rice 5kg", category: "Rice & Grains", sku: "RICE001", unit: "KG", mrp: 520, purchasePrice: 420, sellingPrice: 485, gstRate: 5, stock: 50, minStock: 10, hsn: "1006" },
            { name: "Daawat Rozana Gold 1kg", category: "Rice & Grains", sku: "RICE002", unit: "KG", mrp: 95, purchasePrice: 75, sellingPrice: 88, gstRate: 5, stock: 100, minStock: 20, hsn: "1006" },
            { name: "Aashirvaad Atta 5kg", category: "Groceries", sku: "ATTA001", unit: "KG", mrp: 245, purchasePrice: 195, sellingPrice: 225, gstRate: 0, stock: 80, minStock: 15, hsn: "1101" },
            { name: "Pillsbury Chakki Fresh Atta 10kg", category: "Groceries", sku: "ATTA002", unit: "KG", mrp: 450, purchasePrice: 380, sellingPrice: 425, gstRate: 0, stock: 40, minStock: 10, hsn: "1101" },
            { name: "Fortune Maida 1kg", category: "Groceries", sku: "MAIDA001", unit: "KG", mrp: 55, purchasePrice: 42, sellingPrice: 50, gstRate: 0, stock: 60, minStock: 15, hsn: "1101" },
            
            // DAIRY
            { name: "Amul Taaza Milk 1L", category: "Dairy & Eggs", sku: "MILK001", unit: "LTR", mrp: 72, purchasePrice: 58, sellingPrice: 68, gstRate: 0, stock: 200, minStock: 50, hsn: "0401" },
            { name: "Amul Gold Milk 500ml", category: "Dairy & Eggs", sku: "MILK002", unit: "ML", mrp: 40, purchasePrice: 32, sellingPrice: 38, gstRate: 0, stock: 150, minStock: 40, hsn: "0401" },
            { name: "Amul Butter 500g", category: "Dairy & Eggs", sku: "BUTTER001", unit: "GM", mrp: 275, purchasePrice: 225, sellingPrice: 260, gstRate: 12, stock: 40, minStock: 10, hsn: "0405" },
            { name: "Amul Cheese Slices 200g", category: "Dairy & Eggs", sku: "CHEESE001", unit: "GM", mrp: 135, purchasePrice: 108, sellingPrice: 125, gstRate: 12, stock: 35, minStock: 8, hsn: "0406" },
            { name: "Amul Paneer 200g", category: "Dairy & Eggs", sku: "PANEER001", unit: "GM", mrp: 95, purchasePrice: 75, sellingPrice: 88, gstRate: 0, stock: 45, minStock: 10, hsn: "0406" },
            { name: "Amul Curd 400g", category: "Dairy & Eggs", sku: "CURD001", unit: "GM", mrp: 52, purchasePrice: 42, sellingPrice: 48, gstRate: 0, stock: 80, minStock: 20, hsn: "0403" },
            { name: "Amul Masti Buttermilk 1L", category: "Dairy & Eggs", sku: "BUTTERMILK001", unit: "LTR", mrp: 45, purchasePrice: 36, sellingPrice: 42, gstRate: 0, stock: 60, minStock: 15, hsn: "0403" },
            { name: "Farm Fresh Eggs 12pcs", category: "Dairy & Eggs", sku: "EGGS001", unit: "PCS", mrp: 95, purchasePrice: 75, sellingPrice: 88, gstRate: 0, stock: 100, minStock: 30, hsn: "0407" },
            { name: "Venky's Eggs 6pcs", category: "Dairy & Eggs", sku: "EGGS002", unit: "PCS", mrp: 55, purchasePrice: 44, sellingPrice: 50, gstRate: 0, stock: 80, minStock: 20, hsn: "0407" },
            
            // SPICES & MASALA
            { name: "MDH Deggi Mirch 100g", category: "Spices & Masala", sku: "SPICE001", unit: "GM", mrp: 85, purchasePrice: 68, sellingPrice: 78, gstRate: 0, stock: 40, minStock: 10, hsn: "0904" },
            { name: "MDH Haldi Powder 100g", category: "Spices & Masala", sku: "SPICE002", unit: "GM", mrp: 42, purchasePrice: 34, sellingPrice: 38, gstRate: 0, stock: 45, minStock: 12, hsn: "0910" },
            { name: "Everest Garam Masala 100g", category: "Spices & Masala", sku: "SPICE003", unit: "GM", mrp: 95, purchasePrice: 76, sellingPrice: 88, gstRate: 0, stock: 35, minStock: 8, hsn: "0910" },
            { name: "Everest Kitchen King Masala 100g", category: "Spices & Masala", sku: "SPICE004", unit: "GM", mrp: 82, purchasePrice: 66, sellingPrice: 75, gstRate: 0, stock: 40, minStock: 10, hsn: "0910" },
            { name: "Catch Red Chilli Powder 200g", category: "Spices & Masala", sku: "SPICE005", unit: "GM", mrp: 125, purchasePrice: 100, sellingPrice: 115, gstRate: 0, stock: 30, minStock: 8, hsn: "0904" },
            { name: "Tata Sampann Coriander Powder 200g", category: "Spices & Masala", sku: "SPICE006", unit: "GM", mrp: 95, purchasePrice: 76, sellingPrice: 88, gstRate: 0, stock: 35, minStock: 10, hsn: "0910" },
            
            // OIL & GHEE
            { name: "Fortune Sunflower Oil 1L", category: "Oil & Ghee", sku: "OIL001", unit: "LTR", mrp: 165, purchasePrice: 132, sellingPrice: 152, gstRate: 5, stock: 60, minStock: 15, hsn: "1512" },
            { name: "Fortune Mustard Oil 1L", category: "Oil & Ghee", sku: "OIL002", unit: "LTR", mrp: 185, purchasePrice: 148, sellingPrice: 172, gstRate: 5, stock: 50, minStock: 12, hsn: "1514" },
            { name: "Saffola Gold Oil 1L", category: "Oil & Ghee", sku: "OIL003", unit: "LTR", mrp: 195, purchasePrice: 156, sellingPrice: 182, gstRate: 5, stock: 45, minStock: 10, hsn: "1512" },
            { name: "Amul Pure Ghee 1L", category: "Oil & Ghee", sku: "GHEE001", unit: "LTR", mrp: 650, purchasePrice: 520, sellingPrice: 595, gstRate: 12, stock: 25, minStock: 5, hsn: "0405" },
            { name: "Dalda Vanaspati 1L", category: "Oil & Ghee", sku: "DALDA001", unit: "LTR", mrp: 145, purchasePrice: 116, sellingPrice: 135, gstRate: 5, stock: 40, minStock: 10, hsn: "1516" },
            
            // SNACKS
            { name: "Lay's Classic Salted 52g", category: "Snacks", sku: "CHIPS001", unit: "GM", mrp: 20, purchasePrice: 15, sellingPrice: 18, gstRate: 12, stock: 150, minStock: 40, hsn: "1905" },
            { name: "Lay's Magic Masala 52g", category: "Snacks", sku: "CHIPS002", unit: "GM", mrp: 20, purchasePrice: 15, sellingPrice: 18, gstRate: 12, stock: 140, minStock: 35, hsn: "1905" },
            { name: "Bingo! Mad Angles 45g", category: "Snacks", sku: "CHIPS003", unit: "GM", mrp: 10, purchasePrice: 7.5, sellingPrice: 9, gstRate: 12, stock: 200, minStock: 50, hsn: "1905" },
            { name: "Haldiram's Bhujia Sev 200g", category: "Snacks", sku: "NAMKEEN001", unit: "GM", mrp: 95, purchasePrice: 76, sellingPrice: 88, gstRate: 12, stock: 60, minStock: 15, hsn: "1905" },
            { name: "Haldiram's Aloo Bhujia 200g", category: "Snacks", sku: "NAMKEEN002", unit: "GM", mrp: 90, purchasePrice: 72, sellingPrice: 84, gstRate: 12, stock: 55, minStock: 15, hsn: "1905" },
            { name: "Britannia Good Day Cashew 72g", category: "Snacks", sku: "BISCUIT001", unit: "GM", mrp: 25, purchasePrice: 19, sellingPrice: 22, gstRate: 18, stock: 120, minStock: 30, hsn: "1905" },
            { name: "Parle-G Gold 100g", category: "Snacks", sku: "BISCUIT002", unit: "GM", mrp: 15, purchasePrice: 11, sellingPrice: 13, gstRate: 18, stock: 200, minStock: 50, hsn: "1905" },
            { name: "Monaco Classic 76.8g", category: "Snacks", sku: "BISCUIT003", unit: "GM", mrp: 25, purchasePrice: 19, sellingPrice: 22, gstRate: 18, stock: 100, minStock: 25, hsn: "1905" },
            
            // BEVERAGES
            { name: "Tata Tea Gold 250g", category: "Beverages", sku: "TEA001", unit: "GM", mrp: 165, purchasePrice: 132, sellingPrice: 152, gstRate: 5, stock: 50, minStock: 12, hsn: "0902" },
            { name: "Brooke Bond Red Label 250g", category: "Beverages", sku: "TEA002", unit: "GM", mrp: 145, purchasePrice: 116, sellingPrice: 135, gstRate: 5, stock: 55, minStock: 15, hsn: "0902" },
            { name: "Nescafe Classic 50g", category: "Beverages", sku: "COFFEE001", unit: "GM", mrp: 165, purchasePrice: 132, sellingPrice: 152, gstRate: 5, stock: 40, minStock: 10, hsn: "0901" },
            { name: "Bru Instant Coffee 100g", category: "Beverages", sku: "COFFEE002", unit: "GM", mrp: 285, purchasePrice: 228, sellingPrice: 265, gstRate: 5, stock: 30, minStock: 8, hsn: "0901" },
            { name: "Coca-Cola 750ml", category: "Beverages", sku: "COLDDRINK001", unit: "ML", mrp: 40, purchasePrice: 32, sellingPrice: 37, gstRate: 28, stock: 100, minStock: 25, hsn: "2202" },
            { name: "Sprite 750ml", category: "Beverages", sku: "COLDDRINK002", unit: "ML", mrp: 40, purchasePrice: 32, sellingPrice: 37, gstRate: 28, stock: 95, minStock: 25, hsn: "2202" },
            { name: "Thums Up 750ml", category: "Beverages", sku: "COLDDRINK003", unit: "ML", mrp: 40, purchasePrice: 32, sellingPrice: 37, gstRate: 28, stock: 90, minStock: 22, hsn: "2202" },
            { name: "Tropicana Orange 1L", category: "Beverages", sku: "JUICE001", unit: "LTR", mrp: 110, purchasePrice: 88, sellingPrice: 102, gstRate: 12, stock: 45, minStock: 12, hsn: "2009" },
            { name: "Real Fruit Power Mango 1L", category: "Beverages", sku: "JUICE002", unit: "LTR", mrp: 105, purchasePrice: 84, sellingPrice: 98, gstRate: 12, stock: 40, minStock: 10, hsn: "2009" },
            
            // PERSONAL CARE
            { name: "Dove Cream Beauty Bar 100g", category: "Personal Care", sku: "SOAP001", unit: "GM", mrp: 55, purchasePrice: 44, sellingPrice: 51, gstRate: 18, stock: 100, minStock: 25, hsn: "3401" },
            { name: "Santoor Sandal Soap 150g", category: "Personal Care", sku: "SOAP002", unit: "GM", mrp: 48, purchasePrice: 38, sellingPrice: 44, gstRate: 18, stock: 120, minStock: 30, hsn: "3401" },
            { name: "Dove Shampoo 340ml", category: "Personal Care", sku: "SHAMPOO001", unit: "ML", mrp: 285, purchasePrice: 228, sellingPrice: 265, gstRate: 18, stock: 35, minStock: 10, hsn: "3305" },
            { name: "Clinic Plus Shampoo 340ml", category: "Personal Care", sku: "SHAMPOO002", unit: "ML", mrp: 185, purchasePrice: 148, sellingPrice: 172, gstRate: 18, stock: 40, minStock: 12, hsn: "3305" },
            { name: "Colgate Strong Teeth 200g", category: "Personal Care", sku: "PASTE001", unit: "GM", mrp: 115, purchasePrice: 92, sellingPrice: 108, gstRate: 18, stock: 60, minStock: 15, hsn: "3306" },
            { name: "Patanjali Dant Kanti 200g", category: "Personal Care", sku: "PASTE002", unit: "GM", mrp: 95, purchasePrice: 76, sellingPrice: 88, gstRate: 18, stock: 50, minStock: 12, hsn: "3306" },
            { name: "Lifebuoy Handwash 190ml", category: "Personal Care", sku: "HANDWASH001", unit: "ML", mrp: 85, purchasePrice: 68, sellingPrice: 78, gstRate: 18, stock: 45, minStock: 12, hsn: "3401" },
            { name: "Dettol Liquid 500ml", category: "Personal Care", sku: "DETTOL001", unit: "ML", mrp: 195, purchasePrice: 156, sellingPrice: 182, gstRate: 18, stock: 35, minStock: 10, hsn: "3808" },
            
            // HOUSEHOLD
            { name: "Surf Excel Matic Top Load 2kg", category: "Household", sku: "DETERGENT001", unit: "KG", mrp: 450, purchasePrice: 360, sellingPrice: 415, gstRate: 18, stock: 40, minStock: 10, hsn: "3402" },
            { name: "Ariel Matic 2kg", category: "Household", sku: "DETERGENT002", unit: "KG", mrp: 475, purchasePrice: 380, sellingPrice: 438, gstRate: 18, stock: 35, minStock: 8, hsn: "3402" },
            { name: "Tide Plus 2kg", category: "Household", sku: "DETERGENT003", unit: "KG", mrp: 395, purchasePrice: 316, sellingPrice: 365, gstRate: 18, stock: 45, minStock: 12, hsn: "3402" },
            { name: "Rin Bar 250g", category: "Household", sku: "DETERGENT004", unit: "GM", mrp: 25, purchasePrice: 19, sellingPrice: 22, gstRate: 18, stock: 150, minStock: 40, hsn: "3401" },
            { name: "Vim Dishwash Bar 200g", category: "Household", sku: "DISH001", unit: "GM", mrp: 20, purchasePrice: 15, sellingPrice: 18, gstRate: 18, stock: 180, minStock: 45, hsn: "3405" },
            { name: "Vim Liquid 500ml", category: "Household", sku: "DISH002", unit: "ML", mrp: 115, purchasePrice: 92, sellingPrice: 108, gstRate: 18, stock: 50, minStock: 15, hsn: "3405" },
            { name: "Harpic Power Plus 500ml", category: "Household", sku: "TOILET001", unit: "ML", mrp: 95, purchasePrice: 76, sellingPrice: 88, gstRate: 18, stock: 45, minStock: 12, hsn: "3808" },
            { name: "Lizol Disinfectant 500ml", category: "Household", sku: "FLOOR001", unit: "ML", mrp: 115, purchasePrice: 92, sellingPrice: 108, gstRate: 18, stock: 40, minStock: 10, hsn: "3808" },
            { name: "Good Knight Fast Card 10pcs", category: "Household", sku: "MOSQUITO001", unit: "PCS", mrp: 35, purchasePrice: 27, sellingPrice: 32, gstRate: 18, stock: 80, minStock: 20, hsn: "3808" },
            
            // BABY CARE
            { name: "Pampers Baby Dry Pants M 56pcs", category: "Baby Care", sku: "DIAPER001", unit: "PCS", mrp: 850, purchasePrice: 680, sellingPrice: 785, gstRate: 12, stock: 30, minStock: 8, hsn: "9619" },
            { name: "Huggies Wonder Pants L 48pcs", category: "Baby Care", sku: "DIAPER002", unit: "PCS", mrp: 925, purchasePrice: 740, sellingPrice: 855, gstRate: 12, stock: 25, minStock: 6, hsn: "9619" },
            { name: "Johnson's Baby Powder 200g", category: "Baby Care", sku: "BABYPOWDER001", unit: "GM", mrp: 135, purchasePrice: 108, sellingPrice: 125, gstRate: 18, stock: 40, minStock: 10, hsn: "3304" },
            { name: "Johnson's Baby Soap 100g", category: "Baby Care", sku: "BABYSOAP001", unit: "GM", mrp: 75, purchasePrice: 60, sellingPrice: 69, gstRate: 18, stock: 50, minStock: 12, hsn: "3401" },
            { name: "Cerelac Stage 1 Rice 300g", category: "Baby Care", sku: "CERELAC001", unit: "GM", mrp: 185, purchasePrice: 148, sellingPrice: 172, gstRate: 5, stock: 35, minStock: 10, hsn: "1901" },
            
            // ELECTRONICS
            { name: "Duracell AA Batteries 4pcs", category: "Electronics", sku: "BATTERY001", unit: "PCS", mrp: 145, purchasePrice: 115, sellingPrice: 132, gstRate: 18, stock: 60, minStock: 15, hsn: "8506" },
            { name: "Eveready Red AA 4pcs", category: "Electronics", sku: "BATTERY002", unit: "PCS", mrp: 55, purchasePrice: 43, sellingPrice: 50, gstRate: 18, stock: 100, minStock: 25, hsn: "8506" },
            { name: "Philips LED Bulb 9W", category: "Electronics", sku: "BULB001", unit: "PCS", mrp: 125, purchasePrice: 99, sellingPrice: 115, gstRate: 12, stock: 40, minStock: 10, hsn: "8539" },
            { name: "Havells LED Bulb 12W", category: "Electronics", sku: "BULB002", unit: "PCS", mrp: 145, purchasePrice: 115, sellingPrice: 132, gstRate: 12, stock: 35, minStock: 8, hsn: "8539" },
            { name: "Syska Mobile Charger", category: "Electronics", sku: "CHARGER001", unit: "PCS", mrp: 295, purchasePrice: 235, sellingPrice: 272, gstRate: 18, stock: 25, minStock: 6, hsn: "8504" },
            { name: "SanDisk 32GB Pen Drive", category: "Electronics", sku: "PENDRIVE001", unit: "PCS", mrp: 450, purchasePrice: 360, sellingPrice: 415, gstRate: 18, stock: 20, minStock: 5, hsn: "8523" },
            
            // STATIONERY
            { name: "Classmate Notebook A4 172pgs", category: "Stationery", sku: "NOTEBOOK001", unit: "PCS", mrp: 75, purchasePrice: 59, sellingPrice: 69, gstRate: 12, stock: 60, minStock: 15, hsn: "4820" },
            { name: "Navneet Notebook A4 140pgs", category: "Stationery", sku: "NOTEBOOK002", unit: "PCS", mrp: 55, purchasePrice: 43, sellingPrice: 50, gstRate: 12, stock: 80, minStock: 20, hsn: "4820" },
            { name: "Reynolds Trimax Pen Blue", category: "Stationery", sku: "PEN001", unit: "PCS", mrp: 40, purchasePrice: 31, sellingPrice: 36, gstRate: 12, stock: 100, minStock: 25, hsn: "9608" },
            { name: "Cello Butterflow Pen Blue", category: "Stationery", sku: "PEN002", unit: "PCS", mrp: 20, purchasePrice: 15, sellingPrice: 18, gstRate: 12, stock: 150, minStock: 40, hsn: "9608" },
            { name: "Faber-Castell Pencils 10pcs", category: "Stationery", sku: "PENCIL001", unit: "PCS", mrp: 65, purchasePrice: 51, sellingPrice: 59, gstRate: 12, stock: 70, minStock: 18, hsn: "9609" },
            { name: "Apsara Platinum Pencils 10pcs", category: "Stationery", sku: "PENCIL002", unit: "PCS", mrp: 55, purchasePrice: 43, sellingPrice: 50, gstRate: 12, stock: 80, minStock: 20, hsn: "9609" },
        ];

        // Insert products
        let productCount = 0;
        for (const product of indianProducts) {
            await db.insert(products).values({
                organizationId,
                storeId,
                name: product.name,
                category: product.category,
                sku: product.sku,
                unit: product.unit,
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
        // 9. CREATE SAMPLE CUSTOMERS
        // ============================================
        console.log("👥 Creating customers...");
        const customersData = [
            { name: "Walk-in Customer", phone: "0000000000", email: "", loyaltyPoints: 0 },
            { name: "Rajesh Kumar", phone: "+91 98765 12345", email: "rajesh@example.com", loyaltyPoints: 150 },
            { name: "Priya Sharma", phone: "+91 98765 23456", email: "priya@example.com", loyaltyPoints: 320 },
            { name: "Suresh Patel", phone: "+91 98765 34567", email: "suresh@example.com", loyaltyPoints: 85 },
            { name: "Anita Reddy", phone: "+91 98765 45678", email: "anita@example.com", loyaltyPoints: 275 },
            { name: "Vikram Singh", phone: "+91 98765 56789", email: "vikram@example.com", loyaltyPoints: 190 },
            { name: "Meera Iyer", phone: "+91 98765 67890", email: "meera@example.com", loyaltyPoints: 420 },
            { name: "Arun Nair", phone: "+91 98765 78901", email: "arun@example.com", loyaltyPoints: 65 },
            { name: "Deepa Joshi", phone: "+91 98765 89012", email: "deepa@example.com", loyaltyPoints: 230 },
            { name: "Kiran Shah", phone: "+91 98765 90123", email: "kiran@example.com", loyaltyPoints: 175 },
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

        // ============================================
        // SUMMARY
        // ============================================
        console.log("=" .repeat(60));
        console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
        console.log("=" .repeat(60));
        console.log("\n📊 Summary:");
        console.log(`   • Organization: SuperMart India`);
        console.log(`   • Store: Main Branch - Bangalore`);
        console.log(`   • Categories: ${categoriesData.length}`);
        console.log(`   • Units: ${unitsData.length}`);
        console.log(`   • Suppliers: ${suppliersData.length}`);
        console.log(`   • Products: ${productCount}`);
        console.log(`   • Customers: ${customersData.length}`);
        console.log("\n🔑 Login Credentials:");
        console.log(`   Email: admin@supermart.in`);
        console.log(`   Password: admin123`);
        console.log(`   Role: Administrator`);
        console.log("\n💰 Currency: Indian Rupee (₹)");
        console.log("🧾 GST Enabled: Yes (5%, 12%, 18%, 28%)");
        console.log("🏷️  HSN Codes: Included for all products");
        console.log("\n" + "=".repeat(60) + "\n");

    } catch (error) {
        console.error("\n❌ Error seeding database:", error);
        throw error;
    } finally {
        process.exit(0);
    }
}

seed();
