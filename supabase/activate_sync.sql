-- ============================================================
-- SCRIPT AKTIVASI SINKRONISASI CLOUD RESIK V4.0 KE SUPABASE
-- BUMDes Makmur Gedangan
-- Jalankan script ini di Supabase SQL Editor Anda
-- ============================================================

-- 1. Buat tabel resik_cloud_sync untuk sinkronisasi real-time antar-perangkat
CREATE TABLE IF NOT EXISTS public.resik_cloud_sync (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nonaktifkan Row Level Security (RLS) agar semua perangkat (laptop/HP) bisa membaca & menyimpan data
ALTER TABLE public.resik_cloud_sync DISABLE ROW LEVEL SECURITY;

-- 3. Nonaktifkan RLS pada tabel-tabel bawaan schema
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tariffs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.broadcasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_registrations DISABLE ROW LEVEL SECURITY;

-- 4. Berikan hak akses penuh ke role anon, authenticated, dan service_role
GRANT ALL ON TABLE public.resik_cloud_sync TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
