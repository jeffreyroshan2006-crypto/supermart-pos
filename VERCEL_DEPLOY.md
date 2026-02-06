# SuperMart POS - Vercel Deployment Guide

## 🚀 Quick Deploy Steps

### 1. Prepare Your Repository

The workflow files have been created. Now you need to:

```bash
# Commit the new files
git add .
git commit -m "feat: Add Vercel deployment workflow and configuration"
git push origin main
```

### 2. Setup Vercel Project

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Initialize project (run this in your project directory)
vercel

# Follow the prompts:
# ? Set up and deploy "~/Projects/supermart-pos"? [Y/n] y
# ? Which scope do you want to deploy to? [your-username]
# ? Link to existing project? [n]
# ? What's your project name? [supermart-pos]
# ? In which directory is your code located? ./
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `jeffreyroshan2006-crypto/supermart-pos`
4. Configure the project:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Configure Environment Variables

In Vercel dashboard, go to **Settings** > **Environment Variables** and add:

```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SESSION_SECRET=your-super-secret-key-min-32-characters-long-for-production
NODE_ENV=production
```

**Important**: Generate a strong SESSION_SECRET:
```bash
# Generate a secure random string
openssl rand -base64 32
```

### 4. Deploy

#### Manual Deploy
```bash
vercel --prod
```

#### GitHub Integration (Auto-deploy)
The workflow file `.github/workflows/deploy.yml` has been created. To enable auto-deploy:

1. Install the [Vercel GitHub Integration](https://vercel.com/integrations/github)
2. Connect your repository
3. Vercel will automatically deploy on every push to main

### 5. Required GitHub Secrets

For the GitHub Actions workflow to work, add these secrets to your repository:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
DATABASE_URL=your-database-url
```

**Get your Vercel tokens:**
```bash
# Get VERCEL_TOKEN
vercel tokens create

# Get ORG_ID and PROJECT_ID
vercel env ls
# Or check .vercel/project.json after running vercel
```

## 📋 Pre-deployment Checklist

- [ ] Database is set up on Supabase
- [ ] Environment variables configured in Vercel
- [ ] GitHub secrets added (for CI/CD)
- [ ] Build succeeds locally: `npm run build`
- [ ] Database migrations ready: `npm run db:push`

## 🔧 Build Configuration

The build process:
1. Compiles TypeScript
2. Builds frontend with Vite → `dist/public`
3. Bundles backend with esbuild → `dist/index.cjs`
4. Copies API entry point → `api/index.js`

## 🌐 Domain Configuration

After deployment, you can:

1. **Use Vercel subdomain**: `https://supermart-pos.vercel.app`
2. **Custom domain**: Add your domain in Vercel dashboard

### Setting up Custom Domain

1. Go to Vercel dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `pos.yourbusiness.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate to be issued

## 🔄 Continuous Deployment

The GitHub Actions workflow will:
- Run on every push to `main` or `develop`
- Run TypeScript checks
- Build the project
- Deploy to Vercel (production for main, preview for PRs)
- Run database migrations automatically

## 🐛 Troubleshooting

### Build Failures

**Error**: `Cannot find module 'xyz'`
**Solution**: Add the missing dependency to `allowlist` in `script/build.ts`

**Error**: `DATABASE_URL is not set`
**Solution**: Check environment variables in Vercel dashboard

**Error**: `Session secret not set`
**Solution**: Add SESSION_SECRET environment variable

### Runtime Errors

**Error**: `Cannot connect to database`
**Solution**: 
- Verify DATABASE_URL is correct
- Check if database is accessible from Vercel's IPs
- Enable connection pooling on Supabase

**Error**: `CORS errors in browser`
**Solution**: Check vercel.json headers configuration

### Common Fixes

```bash
# Clear Vercel cache and redeploy
vercel --force

# Check logs
vercel logs --all

# List environment variables
vercel env ls
```

## 📊 Monitoring

After deployment:

1. **Vercel Analytics**: View in dashboard
2. **Function Logs**: Check Vercel Functions tab
3. **Database Monitoring**: Use Supabase dashboard
4. **Uptime Monitoring**: Use Vercel monitoring

## 🔒 Security Checklist

- [ ] SESSION_SECRET is strong and unique
- [ ] DATABASE_URL uses SSL
- [ ] Environment variables are encrypted
- [ ] No secrets committed to git
- [ ] RLS enabled on database
- [ ] HTTPS enforced

## 🚀 Performance Optimization

1. **Enable Vercel Edge Network**: Automatic
2. **Connection Pooling**: Use PgBouncer on Supabase
3. **Static Assets**: Cached automatically by Vercel
4. **API Routes**: Serverless functions

## 📞 Support

If deployment fails:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test build locally: `npm run build`
4. Check GitHub Actions logs
5. Review [Vercel Documentation](https://vercel.com/docs)

## ✅ Success!

After successful deployment:
- ✅ Application is live
- ✅ Auto-deploy on git push enabled
- ✅ Production database connected
- ✅ Ready for use!

**Your POS is now live and ready to process sales!** 🎉
