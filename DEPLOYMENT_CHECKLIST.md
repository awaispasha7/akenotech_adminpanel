# Pre-Deployment Checklist

Use this checklist to ensure your project is ready for Railway deployment.

## ✅ Configuration Files

- [x] `next.config.ts` - Standalone output enabled
- [x] `railway.json` - Railway configuration present
- [x] `package.json` - Build and start scripts configured
- [x] `.gitignore` - Proper files excluded
- [x] `tsconfig.json` - TypeScript configuration valid

## ✅ Code Verification

- [ ] No TypeScript errors (run `npm run build` locally first)
- [ ] No linting errors (run `npm run lint`)
- [ ] All components import correctly
- [ ] Supabase credentials are configured in `src/lib/supabase.ts`

## ✅ Before Pushing to GitHub

1. **Test Build Locally:**
   ```bash
   npm install
   npm run build
   ```
   - If this fails, fix errors before deploying

2. **Test Application Locally:**
   ```bash
   npm run dev
   ```
   - Verify login works
   - Check all features function

3. **Verify Git Status:**
   ```bash
   git status
   ```
   - Ensure only necessary files are tracked
   - `.env` files should NOT be committed
   - `node_modules` should NOT be committed

## ✅ Deployment Steps Summary

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Railway:**
   - Connect GitHub repo to Railway
   - Railway will auto-detect Next.js
   - Build and deploy automatically

## ⚠️ Known Configuration

- **Supabase Credentials**: Hardcoded in `src/lib/supabase.ts` (no env vars needed)
- **Backend API**: `https://web-production-608ab4.up.railway.app`
- **Admin Emails**: Configured in `src/lib/supabase.ts`

## 🔍 Quick Test Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint

# Test build
npm run build

# Test start (after build)
npm start
```

## 🚨 Common Issues to Avoid

1. **Don't commit sensitive data** - Already in `.gitignore`
2. **Don't commit `node_modules`** - Already in `.gitignore`
3. **Ensure `.env` files are ignored** - Already in `.gitignore`
4. **Verify all imports are correct** - Check for missing dependencies

---

**Status: Ready for Deployment** ✅

