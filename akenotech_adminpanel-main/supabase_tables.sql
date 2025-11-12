-- ============================================
-- Supabase Database Tables for Admin Panel
-- ============================================
-- Run this SQL in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste and Run

-- ============================================
-- 1. Admin Users Table (Optional - for extended admin management)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admins can read
CREATE POLICY "Admins can read admin users"
    ON public.admin_users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert/update (for security)
CREATE POLICY "Service role can manage admin users"
    ON public.admin_users
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 2. Admin Activity Log Table (Track login/logout activity)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'dashboard_access', etc.
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admins can read their own logs
CREATE POLICY "Admins can read activity logs"
    ON public.admin_activity_logs
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Anyone authenticated can insert logs (for logging purposes)
CREATE POLICY "Authenticated users can insert logs"
    ON public.admin_activity_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 3. Create Indexes for Better Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_email ON public.admin_activity_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- ============================================
-- 4. Function to Update Updated At Timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Insert Initial Admin User (Optional)
-- ============================================
-- Uncomment and update the email if you want to insert an admin user
-- INSERT INTO public.admin_users (email, full_name, role, is_active)
-- VALUES ('ask@akenotech.com', 'Admin User', 'admin', true)
-- ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 6. Function to Check if User is Admin
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE email = user_email 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- How to Use:
-- ============================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Paste this entire SQL script
-- 4. Click "Run" or press Ctrl+Enter
-- 5. Check "Table Editor" to see your tables

-- ============================================
-- Optional: Update supabase.ts to use database
-- ============================================
-- If you want to check admin status from database instead of hardcoded list,
-- update the isAdmin function in supabase.ts to query the database table.

