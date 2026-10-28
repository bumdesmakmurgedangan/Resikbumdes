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

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.resik_cloud_sync ENABLE ROW LEVEL SECURITY;

-- 3. Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "Allow select for resik sync" ON public.resik_cloud_sync;
DROP POLICY IF EXISTS "Allow insert for resik sync" ON public.resik_cloud_sync;
DROP POLICY IF EXISTS "Allow update for resik sync" ON public.resik_cloud_sync;
DROP POLICY IF EXISTS "Allow delete for resik sync" ON public.resik_cloud_sync;

-- 4. Buat RLS Policies aman (Boleh SELECT, INSERT, UPDATE. DELETE diblokir)
CREATE POLICY "Allow select for resik sync"
ON public.resik_cloud_sync FOR SELECT TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow insert for resik sync"
ON public.resik_cloud_sync FOR INSERT TO anon, authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Allow update for resik sync"
ON public.resik_cloud_sync FOR UPDATE TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.resik_cloud_sync TO anon, authenticated, service_role;
