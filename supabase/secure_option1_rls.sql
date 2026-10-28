-- ============================================================
-- SCRIPT PENGAMANAN OPSI 1: LOCKDOWN TABEL RELASIONAL (RLS ON)
-- BUMDes Makmur Gedangan - RESIK V4
-- Aman & Otomatis mendeteksi tabel yang ada tanpa error
-- ============================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Ulangi untuk setiap tabel yang ada di schema public (kecuali tabel sync resik_cloud_sync)
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename != 'resik_cloud_sync'
    ) 
    LOOP 
        -- 1. Aktifkan Row Level Security (RLS)
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        
        -- 2. Cabut izin akses publik anon
        EXECUTE 'REVOKE ALL ON TABLE public.' || quote_ident(r.tablename) || ' FROM anon;';
        
        RAISE NOTICE 'RLS diaktifkan & akses anon dicabut untuk tabel: %', r.tablename;
    END LOOP; 
END $$;

-- 3. Pastikan tabel sinkronisasi aktif RESIK V4 tetap dapat diakses normal oleh aplikasi
GRANT ALL ON TABLE public.resik_cloud_sync TO anon, authenticated, service_role;

-- ============================================================
-- SELESAI.
-- Silakan buka menu Advisors > Security Advisor lalu klik 'Rerun linter'.
-- ============================================================
