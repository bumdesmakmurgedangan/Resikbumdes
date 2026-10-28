-- ============================================================
-- SCRIPT PENGAMANAN OPSI 2: AKTIFKAN RLS PADA resik_cloud_sync
-- BUMDes Makmur Gedangan - RESIK V4
-- Mengamankan tabel sync dari penghapusan luar (Anti-DELETE)
-- dan menuntaskan 1 error terakhir di Supabase Security Advisor
-- ============================================================

-- 1. Aktifkan Row Level Security (RLS) pada tabel resik_cloud_sync
ALTER TABLE public.resik_cloud_sync ENABLE ROW LEVEL SECURITY;

-- 2. Bersihkan policy lama jika ada (agar tidak duplikat)
DROP POLICY IF EXISTS "Allow select for resik sync" ON public.resik_cloud_sync;
DROP POLICY IF EXISTS "Allow insert for resik sync" ON public.resik_cloud_sync;
DROP POLICY IF EXISTS "Allow update for resik sync" ON public.resik_cloud_sync;
DROP POLICY IF EXISTS "Allow delete for resik sync" ON public.resik_cloud_sync;

-- 3. Policy BACA (SELECT): Mengizinkan aplikasi membaca data cadangan sync
CREATE POLICY "Allow select for resik sync"
ON public.resik_cloud_sync
FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 4. Policy SIMPAN BARU (INSERT): Mengizinkan aplikasi mengunggah data sync baru
CREATE POLICY "Allow insert for resik sync"
ON public.resik_cloud_sync
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

-- 5. Policy PERBARUI (UPDATE): Mengizinkan aplikasi memperbarui data sync yang sudah ada
CREATE POLICY "Allow update for resik sync"
ON public.resik_cloud_sync
FOR UPDATE
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- CATATAN KEAMANAN:
-- Kami SENGAJA TIDAK MEMBUAT POLICY UNTUK DELETE.
-- Dengan demikian, siapapun dari internet (anon/public API) DILARANG KERAS
-- menghapus baris tabel cadangan BUMDes ini (Anti-DELETE Protection).
