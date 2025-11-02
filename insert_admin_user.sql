-- ============================================
-- Insert Admin User into admin_users table
-- ============================================
-- Run this in Supabase SQL Editor

INSERT INTO public.admin_users (
    email,
    full_name,
    role,
    is_active
) VALUES (
    'ask@softtechniques.com',
    'Admin User',
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================
-- How to Run:
-- ============================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Paste this SQL code
-- 4. Click "Run" button
-- 
-- Note: This will insert the user or update if email already exists


