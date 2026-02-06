# 🚀 Deploy to Vercel - Simple Steps

## ⚠️ Important: You MUST Add Secrets to GitHub

The deployment is failing because GitHub Actions needs Vercel credentials.

## 📋 Required Secrets (Add these to GitHub)

Go to: https://github.com/jeffreyroshan2006-crypto/supermart-pos/settings/secrets/actions

### 1. VERCEL_TOKEN
**How to get:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Create token
vercel tokens create
```
**Or go to:** https://vercel.com/account/tokens

### 2. VERCEL_ORG_ID & VERCEL_PROJECT_ID
**How to get:**
```bash
# In your project folder
vercel link

# Then check the file
cat .vercel/project.json
```

### 3. DATABASE_URL
**How to get:**
- Go to https://supabase.com
- Your project → Settings → Database → Connection String
- Copy the URI

## 🔑 Add These 4 Secrets:

| Secret Name | Example Value |
|-------------|---------------|
| `VERCEL_TOKEN` | `vercel_live_xxxxxxxxxxxxx` |
| `VERCEL_ORG_ID` | `team_xxxxxxxxxx` or your username |
| `VERCEL_PROJECT_ID` | `prj_xxxxxxxxxx` |
| `DATABASE_URL` | `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres` |

## 🎯 Alternative: Use Vercel's Native Integration (Easier!)

Instead of GitHub Actions, just connect your repo directly:

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Select `jeffreyroshan2006-crypto/supermart-pos`
4. Vercel will auto-deploy on every push!

**This is the RECOMMENDED way!** No secrets needed!

## 🆘 If Build Still Fails

The build error you're seeing means the frontend build succeeded but there might be an issue. Check:
1. Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Check the "Build Logs" tab for details

## ✅ Current Status

- ✅ Code is ready
- ✅ Build scripts are configured
- ✅ Dependencies are set up
- ❌ Missing: Vercel secrets in GitHub

**Add the secrets and deployment will work!** 🎉
