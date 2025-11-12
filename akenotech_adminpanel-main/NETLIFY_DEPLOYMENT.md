# Deploy to Netlify - Complete Guide

This guide will help you deploy your Akeno Tech Admin Panel to Netlify.

## Prerequisites

- GitHub account with your repository pushed
- Netlify account (free tier works)
- Your Supabase credentials ready

## Step 1: Prepare Your Code

✅ Already done:
- Code is pushed to GitHub: `https://github.com/awaispasha7/akenotech_adminpanel.git`
- `netlify.toml` configuration file created
- `next.config.ts` updated for Netlify

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify**
   - Visit [https://app.netlify.com](https://app.netlify.com)
   - Sign in with your GitHub account

2. **Create New Site**
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **"Deploy with GitHub"**
   - Authorize Netlify to access your GitHub repositories if prompted

3. **Select Your Repository**
   - Find and select **`akenotech_adminpanel`** repository
   - Netlify will automatically detect it's a Next.js project

4. **Configure Build Settings**
   Netlify should auto-detect:
   - **Base directory**: Leave empty (or `akeno_admin` if repo root)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `20`

5. **Set Environment Variables**
   Click **"Show advanced"** → **"New variable"** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cgwikuodyiiwsjlgyuea.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnd2lrdW9keWlpd3NqbGd5dWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjk1NjksImV4cCI6MjA3NzcwNTU2OX0.mm83O7jhzDzKkjn9zvXPhhRCz5p-ZGwXMgyVwOyn8m0
   ```

6. **Deploy**
   - Click **"Deploy site"**
   - Wait for the build to complete (usually 2-5 minutes)

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Navigate to your project**
   ```bash
   cd akeno_admin
   ```

4. **Initialize Netlify**
   ```bash
   netlify init
   ```
   Follow the prompts to link your GitHub repository

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Step 3: Configure Custom Domain (Optional)

1. In your Netlify site dashboard
2. Go to **"Site settings"** → **"Domain management"**
3. Click **"Add custom domain"**
4. Follow the instructions to configure DNS

## Step 4: Continuous Deployment

✅ Automatic: Netlify will automatically deploy when you push to GitHub!

- Every push to `main` branch = Automatic deployment
- Builds are triggered automatically
- Preview deployments for pull requests

## Important Notes

1. **Environment Variables**: Make sure all `NEXT_PUBLIC_*` variables are set in Netlify dashboard

2. **Build Time**: First build takes 2-5 minutes, subsequent builds are faster

3. **Build Logs**: Check build logs if deployment fails
   - Go to **"Deploys"** tab → Click on a deploy → View logs

4. **Node Version**: Currently set to Node 20 in `netlify.toml`

## Troubleshooting

### Build Fails
- Check Node version (should be 20)
- Verify all environment variables are set
- Check build logs for specific errors

### App Not Working After Deployment
- Verify Supabase environment variables are correct
- Check browser console for errors
- Ensure API endpoints are accessible (CORS configured)

### Build Takes Too Long
- Consider using Netlify Build Plugins for caching
- Check if dependencies are correctly listed in `package.json`

## Support

- Netlify Docs: [https://docs.netlify.com](https://docs.netlify.com)
- Next.js on Netlify: [https://docs.netlify.com/integrations/frameworks/next-js/](https://docs.netlify.com/integrations/frameworks/next-js/)

---

**Your site will be live at**: `https://your-site-name.netlify.app`

