# 🚀 Vercel Deployment Setup Guide

## ⚠️ DO NOT Use Those GitHub Templates!

The workflow templates shown in GitHub Actions are **NOT needed**. I've already created the proper workflow file for you.

## ✅ What You Need To Do

### Step 1: Get Vercel Credentials

Run these commands on your local computer:

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link your project (run this in your project folder)
cd /path/to/Retail-BillFlow
vercel link

# 4. After linking, get your credentials
cat .vercel/project.json
```

You'll see something like:
```json
{
  "orgId": "team_xxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxx"
}
```

### Step 2: Create Vercel Token

```bash
# Create a token
vercel tokens create

# Or go to: https://vercel.com/account/tokens
# Click "Create Token"
# Copy the token (starts with something like "vercel_live_xxxx")
```

### Step 3: Add Secrets to GitHub

Go to your GitHub repository:
1. Click **Settings** tab
2. In left sidebar, click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 3 secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VERCEL_TOKEN` | Your token from Step 2 | `vercel_live_xxxxxxxx` |
| `VERCEL_ORG_ID` | From .vercel/project.json | `team_xxxxxxxxxxxx` or your username |
| `VERCEL_PROJECT_ID` | From .vercel/project.json | `prj_xxxxxxxxxxxx` |

### Step 4: Set Up Database

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings** → **Database** → **Connection String**
4. Copy the URI (looks like: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`)
5. Add as secret in GitHub:
   - Name: `DATABASE_URL`
   - Value: Your connection string

### Step 5: Set Up Vercel Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Add:
   - `DATABASE_URL` = your Supabase connection string
   - `SESSION_SECRET` = generate with `openssl rand -base64 32`
   - `NODE_ENV` = `production`

### Step 6: Deploy!

Push to GitHub and it will automatically deploy:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 🔧 Alternative: Easier Method (No GitHub Actions)

If you don't want to set up secrets, use Vercel's native GitHub integration:

1. Go to [vercel.com](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import `jeffreyroshan2006-crypto/supermart-pos`
4. Vercel will automatically:
   - Deploy on every push
   - Handle everything for you

This is the **recommended** way!

## 📋 Complete Secrets Checklist

Add these to GitHub → Settings → Secrets:

```
✅ VERCEL_TOKEN=vercel_live_xxxxxx
✅ VERCEL_ORG_ID=team_xxxxxx or your_username
✅ VERCEL_PROJECT_ID=prj_xxxxxx
✅ DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

## 🎯 What's Already Set Up

✅ Workflow file created (`.github/workflows/vercel-deploy.yml`)
✅ Build script configured
✅ Dependencies in package.json
✅ Vercel configuration ready

**You just need to add the secrets!**

## 🆘 If You Get Errors

### "No existing credentials found"
→ You forgot to add VERCEL_TOKEN secret

### "Cannot find project"
→ Check VERCEL_ORG_ID and VERCEL_PROJECT_ID

### "Database connection failed"
→ Check DATABASE_URL secret

### Build fails
→ Check Vercel dashboard logs for details

## ✅ Success Indicators

After pushing, you should see:
- ✅ GitHub Actions workflow running
- ✅ Vercel deployment successful
- ✅ Live URL provided

**Your app will be live!** 🎉
