# Supabase Authentication Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `soft-admin-panel`
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Create Admin User

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Enter admin credentials:
   - **Email**: `admin@softtechniques.com` (or your admin email)
   - **Password**: (choose a strong password)
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create user"**

### Option B: Using SQL (Alternative)

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL (replace email and password):

```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@softtechniques.com',
  crypt('your_secure_password_here', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

## Step 4: Configure Environment Variables

1. In your `soft_admin` folder, create a file named `.env.local`
2. Add the following (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_ADMIN_EMAIL=admin@softtechniques.com
```

3. **Important**: Never commit `.env.local` to git! It contains sensitive keys.

## Step 5: Disable Email Confirmation (For Admin Access)

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Under **Email Auth**, find **"Enable email confirmations"**
3. **Disable** this setting (uncheck the box)
4. This allows immediate login without email verification

## Step 6: Test the Login

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Try logging in with your admin credentials
4. You should be redirected to the dashboard

## Security Notes

- **Admin-only access**: The system checks if the user email matches `NEXT_PUBLIC_ADMIN_EMAIL` environment variable
- **Token storage**: Supabase automatically stores authentication tokens securely in browser localStorage
- **Session persistence**: Sessions persist across browser restarts
- **Auto refresh**: Tokens are automatically refreshed

## Troubleshooting

### "Invalid login credentials"
- Verify email and password are correct
- Check that user exists in Supabase Authentication → Users

### "Email not confirmed"
- Disable email confirmation in Supabase settings (Step 5)
- Or confirm the email via the link sent

### "Access denied. Only admin users can login"
- Verify the email matches `NEXT_PUBLIC_ADMIN_EMAIL` in `.env.local`
- Check that the environment variable is set correctly

### Environment variables not loading
- Restart your Next.js dev server after adding `.env.local`
- Verify file is named exactly `.env.local` (not `.env`)
- Check that variables start with `NEXT_PUBLIC_`

## Production Deployment

When deploying to production (Vercel, Railway, etc.):

1. Add the same environment variables in your hosting platform's dashboard
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAIL`
3. Redeploy your application

