import { db } from "./db";
import { users, products, suppliers, customers } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
    console.log("🌱 Starting database seeding...");

    try {
        // Create default admin user
        const hashedPassword = await hashPassword("admin123");

        const [adminUser] = await db.insert(users).values({
            username: "admin",
            password: hashedPassword,
            role: "admin",
            name: "Administrator",
        }).onConflictDoNothing().returning();

        if (adminUser) {
            console.log("✅ Created admin user (username: admin, password: admin123)");
        } else {
            console.log("ℹ️  Admin user already exists");
        }

        // Create a sample supplier
        const [supplier] = await db.insert(suppliers).values({
            name: "General Supplies Co.",
            contactInfo: "+91 9876543210",
            address: "123 Market Street, Mumbai",
        }).onConflictDoNothing().returning();

        if (supplier) {
            console.log("✅ Created sample supplier");
        }

        // Create sample products
        const sampleProducts = [
            {
                name: "Rice - Basmati 1kg",
                category: "Groceries",
                sku: "RICE001",
                stockQuantity: 100,
                purchasePrice: "80",
                sellingPrice: "120",
                taxRate: "5",
                supplierId: supplier?.id,
            },
            {
                name: "Milk - Full Cream 1L",
                category: "Dairy",
                sku: "MILK001",
                stockQuantity: 50,
                purchasePrice: "45",
                sellingPrice: "60",
                taxRate: "0",
                supplierId: supplier?.id,
            },
            {
                name: "Bread - Whole Wheat",
                category: "Bakery",
                sku: "BREAD001",
                stockQuantity: 30,
                purchasePrice: "25",
                sellingPrice: "40",
                taxRate: "5",
                supplierId: supplier?.id,
            },
            {
                name: "Eggs - 12 Pack",
                category: "Dairy",
                sku: "EGG001",
                stockQuantity: 40,
                purchasePrice: "60",
                sellingPrice: "84",
                taxRate: "0",
                supplierId: supplier?.id,
            },
            {
                name: "Cooking Oil - 1L",
                category: "Groceries",
                sku: "OIL001",
                stockQuantity: 60,
                purchasePrice: "120",
                sellingPrice: "160",
                taxRate: "5",
                supplierId: supplier?.id,
            },
        ];

        for (const product of sampleProducts) {
            await db.insert(products).values(product).onConflictDoNothing();
        }
        console.log("✅ Created sample products");

        // Create a sample customer
        await db.insert(customers).values({
            name: "Walk-in Customer",
            phone: "0000000000",
            loyaltyPoints: 0,
        }).onConflictDoNothing();
        console.log("✅ Created sample customer");

        console.log("\n🎉 Database seeding completed successfully!");
        console.log("\n📝 Login credentials:");
        console.log("   Username: admin");
        console.log("   Password: admin123\n");

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        throw error;
    } finally {
        process.exit(0);
    }
}

seed();
