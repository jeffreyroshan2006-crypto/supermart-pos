# 🔧 GitHub Secrets Setup Required

Your GitHub Actions workflow is failing because it needs Vercel authentication credentials. You need to add these secrets to your GitHub repository.

## 📋 Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these 4 secrets:

### 1. VERCEL_TOKEN

**How to get it:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Create a token
vercel tokens create

# Or go to: https://vercel.com/account/tokens
```

**Value:** Copy the token string (starts with `vercel_`)

### 2. VERCEL_ORG_ID

**How to get it:**
```bash
# After linking your project
vercel link

# Or check the file:
cat .vercel/project.json
```

**Value:** Looks like `"org_xxxxxxxxxxxx"`

### 3. VERCEL_PROJECT_ID

**How to get it:**
```bash
# Same as above
cat .vercel/project.json
```

**Value:** Looks like `"prj_xxxxxxxxxxxx"`

### 4. DATABASE_URL

**How to get it:**
1. Go to your Supabase project dashboard
2. Settings → Database → Connection String
3. Copy the URI connection string

**Value:** 
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## 📝 Summary

| Secret Name | Where to Find It | Example |
|-------------|------------------|---------|
| `VERCEL_TOKEN` | vercel.com/account/tokens | `vercel_live_xxxxxxxx` |
| `VERCEL_ORG_ID` | .vercel/project.json | `org_XXXXXXXXXXX` |
| `VERCEL_PROJECT_ID` | .vercel/project.json | `prj_XXXXXXXXXXX` |
| `DATABASE_URL` | Supabase dashboard | `postgresql://...` |

## 🎯 After Adding Secrets

Once you add these secrets:
1. ✅ GitHub Actions will authenticate with Vercel
2. ✅ Deployments will proceed automatically
3. ✅ Database migrations will run

## 🚀 Quick Setup Commands

Run these locally to get your credentials:

```bash
# 1. Link project to Vercel
vercel link

# 2. Get the IDs
cat .vercel/project.json

# 3. Create token
vercel tokens create
```

## 💡 Alternative: Disable GitHub Actions

If you don't want to set up secrets, you can disable the workflow:

1. Go to `.github/workflows/deploy.yml`
2. Comment out or delete the file
3. Use Vercel's GitHub integration instead (automatic)

## 📖 More Info

See `VERCEL_DEPLOY.md` for complete deployment instructions.

**Need help?** The error means GitHub can't authenticate with Vercel. Add the secrets above to fix it! 🔑
