# How to Add a New Admin User: asad.aslam@softtechniques.com

Follow these steps to add the new admin user to Supabase Authentication:

## Step 1: Add User in Supabase Authentication Dashboard

1. **Go to Supabase Dashboard**
   - Visit [https://app.supabase.com](https://app.supabase.com)
   - Sign in to your project

2. **Navigate to Authentication**
   - In the left sidebar, click **"Authentication"**
   - Click on **"Users"** tab

3. **Add New User**
   - Click the **"Add user"** button (or **"Invite user"** or **"Create user"**)
   - Choose **"Create new user"** option
   - Enter the following:
     - **Email**: `asad.aslam@softtechniques.com`
     - **Password**: Create a secure password (or generate one)
     - **Auto Confirm User**: ✅ **Check this box** (so they can login immediately)
   - Click **"Create user"** or **"Save"**

4. **Verify User Creation**
   - You should see `asad.aslam@softtechniques.com` in the users list
   - Status should show as **"Confirmed"** or **"Active"**

## Step 2: Code Already Updated ✅

The code has been updated! The email `asad.aslam@softtechniques.com` has already been added to the admin emails list in `src/lib/supabase.ts`.

**No further code changes needed!**

## Step 3: Optional - Add to admin_users Table (if you have it)

If you want to add the user to the `admin_users` table in Supabase, run this SQL:

```sql
INSERT INTO public.admin_users (
    email,
    full_name,
    role,
    is_active
) VALUES (
    'asad.aslam@softtechniques.com',
    'Asad Aslam',
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
```

**To run this SQL:**
1. Go to Supabase Dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Paste the SQL above
5. Click **"Run"** or press `Ctrl+Enter`

## Step 4: Test the Login

1. Go to your admin panel login page
2. Enter:
   - **Email**: `asad.aslam@softtechniques.com`
   - **Password**: (the password you set in Step 1)
3. Click **"Sign In"**
4. You should be able to access the admin dashboard

## Troubleshooting

### "Invalid login credentials"
- Make sure the user exists in Supabase Authentication → Users
- Verify the email is exactly `asad.aslam@softtechniques.com` (case-sensitive)
- Check that the password is correct

### "Access denied. Only admin users can login"
- Verify that `asad.aslam@softtechniques.com` is in the `adminEmails` array in `src/lib/supabase.ts`
- After updating code, restart your development server or redeploy

### User Created but Can't Login
- Make sure **"Auto Confirm User"** was checked when creating the user
- Or manually confirm the user in Supabase Dashboard → Authentication → Users → Click on user → "Confirm user"

## Summary

✅ **Code updated**: `asad.aslam@softtechniques.com` added to admin list
⏳ **Action needed**: Add user in Supabase Authentication Dashboard (Step 1)
✅ **Optional**: Add to admin_users table (Step 3)

Once you complete Step 1, the new admin user can log in!

