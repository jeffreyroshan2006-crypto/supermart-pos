# Vercel Deployment & Database Setup Guide

It appears your local network issues prevented the initial database setup. You must manually create the database tables in Supabase for the app to work.
If you see "relation already exists" errors, that is fine! It means the tables are there.
**Crucially, run the final INSERT statement to create the admin user.**

## Step 1: Manual Database Setup (Critical)
1. Go to your **Supabase Dashboard** > **SQL Editor**.
2. Click "New Query".
3. Copy and paste the **entire SQL block** below and click **Run**.

```sql
CREATE TABLE IF NOT EXISTS "bill_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric NOT NULL,
	"tax" numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_number" text NOT NULL,
	"public_id" text DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now(),
	"subtotal" numeric NOT NULL,
	"tax_total" numeric NOT NULL,
	"discount_total" numeric DEFAULT '0',
	"grand_total" numeric NOT NULL,
	"payment_mode" text NOT NULL,
	"customer_id" integer,
	"cashier_id" integer,
	CONSTRAINT "bills_bill_number_unique" UNIQUE("bill_number"),
	CONSTRAINT "bills_public_id_unique" UNIQUE("public_id")
);

CREATE TABLE IF NOT EXISTS "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"loyalty_points" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);

CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"sku" text NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"purchase_price" numeric NOT NULL,
	"selling_price" numeric NOT NULL,
	"tax_rate" numeric DEFAULT '0' NOT NULL,
	"supplier_id" integer,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);

CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_info" text,
	"address" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'cashier' NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bills" ADD CONSTRAINT "bills_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bills" ADD CONSTRAINT "bills_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;

-- CRITICAL: Create the Admin User manually
INSERT INTO "users" ("username", "password", "role", "name")
VALUES ('admin', '84f69d6f8a58da860606775b9464629e:f772420a21c3f8485641ea97295f494c2005d4b795c6bd895c4dc782abdd0946859f77ef7ae2a1466523dfc3356d617fbfc933385c47414c93f1f055db3f5ebe', 'admin', 'System Admin')
ON CONFLICT ("username") DO NOTHING;

-- AND run this to ensure sessions work
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
```

### ⚠️ If you got an error saying "already exists":
It means the tables were already there, but the script stopped before creating the user.
**Please Clear the Editor and Run ONLY this part:**

```sql
INSERT INTO "users" ("username", "password", "role", "name")
VALUES ('admin', '84f69d6f8a58da860606775b9464629e:f772420a21c3f8485641ea97295f494c2005d4b795c6bd895c4dc782abdd0946859f77ef7ae2a1466523dfc3356d617fbfc933385c47414c93f1f055db3f5ebe', 'admin', 'System Admin')
ON CONFLICT ("username") DO NOTHING;
```

## Step 2: Vercel Configuration
Ensure your Vercel Project Settings > Environment Variables has:
- `DATABASE_URL` 
- `SESSION_SECRET` (random string)

## Step 3: Redeploy
If you added env vars now, Redeploy the latest commit.

## Step 4: Login
Once the SQL is run and deployment finishes, use:
- **Username:** `admin`
- **Password:** `admin123`
