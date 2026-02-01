import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

const url = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL;

if (!url) {
  console.error("CRITICAL ERROR: Database connection string not found. Ensure SUPABASE_DATABASE_URL is set in Vercel.");
}

// Configure connection pool for Supabase / Serverless
export const pool = url ? new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false }, // Required for Supabase/Neon
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null!;

export const db = pool ? drizzle(pool, { schema }) : null!;
