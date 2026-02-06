# ⚠️ IMPORTANT: GitHub Pages Limitation

## Why This App Won't Work on GitHub Pages

**GitHub Pages is for STATIC websites only.** This means:

❌ **No Backend Server** - GitHub Pages cannot run Express.js
❌ **No Database** - Cannot connect to PostgreSQL
❌ **No Environment Variables** - Secrets won't work
❌ **No API Routes** - Server-side code won't execute

## What Will Happen

If you deploy to GitHub Pages:
- Frontend (React) might load
- Backend API calls will fail (404 errors)
- Database won't connect
- Login won't work
- POS features won't work

## ✅ Solution: Use Vercel Instead

Vercel supports **full-stack applications** with:
- ✅ Serverless functions
- ✅ Environment variables
- ✅ Database connections
- ✅ API routes
- ✅ Automatic deployments

## 🚀 Easy Vercel Deployment

### Option 1: Connect GitHub to Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Select your repository: `jeffreyroshan2006-crypto/supermart-pos`
5. Vercel will automatically:
   - Detect your project type
   - Configure build settings
   - Deploy on every push

### Option 2: Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 📋 Required Environment Variables

In Vercel dashboard, add:
```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SESSION_SECRET=your-secret-key-min-32-characters
NODE_ENV=production
```

## 🔧 If You Still Want GitHub Pages

GitHub Pages will only show the static frontend. The backend won't work.

To make it work minimally:
1. The workflow files are already set up
2. Build will create static files
3. But POS features requiring backend will be broken

**Recommendation: Use Vercel for this project!** 🎯
