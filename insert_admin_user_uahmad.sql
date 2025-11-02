-- SQL to add uahmad@softtechniques.com to admin_users table
-- Run this in Supabase SQL Editor if you want to add the user to the admin_users table

INSERT INTO public.admin_users (
    email,
    full_name,
    role,
    is_active
) VALUES (
    'uahmad@softtechniques.com',
    'U Ahmad',
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

