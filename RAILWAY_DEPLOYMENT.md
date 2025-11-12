# Railway Deployment Guide for Soft Admin Panel

This guide will help you deploy the `soft_admin` Next.js application to Railway.

## Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. A GitHub repository with your code (optional, but recommended)
3. Your Supabase credentials (already configured in `src/lib/supabase.ts`)

## Step 1: Prepare Your Code

Your code is already configured for Railway deployment with:
- ✅ `next.config.ts` configured with standalone output
- ✅ `railway.json` configuration file
- ✅ Proper build and start scripts in `package.json`

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Sign in or create an account

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (if your code is on GitHub)
   - OR select "Empty Project" and deploy manually

3. **Connect Your Repository (GitHub)**
   - If using GitHub, authorize Railway to access your repository
   - Select the repository containing `soft_admin`
   - Select the branch (usually `main` or `master`)
   - Railway will auto-detect it's a Next.js app

4. **Configure Build Settings**
   - Railway should auto-detect Next.js and set:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Root Directory**: Leave empty (or set to `soft_admin` if deployed from root)

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway Project**
   ```bash
   cd soft_admin
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Step 3: Configure Environment Variables

**Note**: Your Supabase credentials are already hardcoded in `src/lib/supabase.ts`, so you don't need to set environment variables. However, if you want to use environment variables instead, you can:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the **Variables** tab
4. Add these variables (if you modify the code to use env vars):
   - `NEXT_PUBLIC_SUPABASE_URL` (if you modify code)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if you modify code)
   - `NEXT_PUBLIC_ADMIN_EMAIL` (if you modify code)

## Step 4: Configure Port

Railway automatically sets the `PORT` environment variable. Next.js will use it automatically when running `npm start`.

## Step 5: Custom Domain (Optional)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the **Settings** tab
4. Under **Networking**, click **Generate Domain** to get a Railway domain
5. Or click **Custom Domain** to add your own domain

## Step 6: Monitor Your Deployment

1. Go to your Railway project dashboard
2. Click on your service
3. View the **Deployments** tab to see build logs
4. View the **Metrics** tab to monitor resource usage

## Troubleshooting

### Build Fails

- **Check build logs**: Go to Railway dashboard → Deployments → View logs
- **Common issues**:
  - Missing dependencies: Ensure `package.json` has all required packages
  - TypeScript errors: Fix any TypeScript errors locally first
  - Build timeout: Railway free tier has build time limits

### App Doesn't Start

- **Check start logs**: Railway dashboard → Deployments → View logs
- **Common issues**:
  - Port configuration: Next.js should auto-detect Railway's PORT
  - Missing environment variables: Verify all required vars are set
  - Memory limits: Upgrade Railway plan if app uses too much memory

### Database Connection Issues

- Since Supabase credentials are hardcoded in `src/lib/supabase.ts`, ensure:
  - The Supabase URL is correct
  - The anon key is correct
  - Supabase project is active

### CORS Issues

- Railway deployments are automatically accessible via HTTPS
- Ensure your backend API (Railway backend) allows requests from your Railway frontend domain

## Quick Commands Reference

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Open dashboard
railway open
```

## Post-Deployment Checklist

- [ ] Application is accessible via Railway-generated domain
- [ ] Login functionality works
- [ ] Admin panel loads correctly
- [ ] API connections to backend are working
- [ ] Supabase authentication is functional
- [ ] Custom domain is configured (if needed)

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

**Note**: Your application is configured to use standalone output, which creates an optimized production build perfect for Railway deployment.

