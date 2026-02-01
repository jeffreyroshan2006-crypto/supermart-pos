import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function clearUsers() {
    console.log("🗑️  Clearing existing users...");

    try {
        await db.delete(users);
        console.log("✅ All users cleared successfully!");
    } catch (error) {
        console.error("❌ Error clearing users:", error);
        throw error;
    } finally {
        process.exit(0);
    }
}

clearUsers();
