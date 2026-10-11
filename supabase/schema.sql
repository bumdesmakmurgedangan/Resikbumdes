-- ============================================================
-- RESIK (Retribusi Elektronik & Sistem Informasi Kebersihan)
-- BUMDes Makmur Gedangan - PostgreSQL Database Schema
-- Compatible with Supabase PostgreSQL & RLS
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. USERS (STAFF: SUPER ADMIN, ADMIN, PETUGAS)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'PETUGAS',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS (WARGA)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT UNIQUE NOT NULL, -- e.g. PLG-RW03-0025
    name TEXT NOT NULL,
    phone TEXT, -- Saved as TEXT to preserve leading 0
    address TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    is_default_pin BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    last_reminded_at TIMESTAMPTZ,
    last_reminded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REGIONS (RW & RT)
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rw_code TEXT NOT NULL,
    rt_code TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_region_rw_rt UNIQUE(rw_code, rt_code)
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- Rumah Tangga, UMKM, Perusahaan
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TARIFFS
CREATE TABLE IF NOT EXISTS tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SERVICE LOCATIONS (MULTI-SERVICE PER CUSTOMER)
CREATE TABLE IF NOT EXISTS service_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    service_code TEXT UNIQUE NOT NULL, -- e.g. LYN-RW03-0025-01
    name TEXT NOT NULL, -- Rumah, Toko, Pabrik, dsb
    address TEXT NOT NULL,
    rt TEXT NOT NULL,
    rw TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    tariff_id UUID REFERENCES tariffs(id) ON DELETE RESTRICT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    status TEXT DEFAULT 'ACTIVE',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BILLS (MONTHLY BILLINGS)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES service_locations(id) ON DELETE RESTRICT,
    billing_year INTEGER NOT NULL,
    billing_month INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID', -- UNPAID, PENDING_VERIFICATION, PAID, OVERDUE, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_bill_service_period UNIQUE(service_id, billing_year, billing_month)
);

-- 9. BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL, -- Stored as TEXT
    account_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- PETUGAS, KANTOR, TRANSFER, QRIS
    bank_account_id UUID REFERENCES bank_accounts(id),
    payment_proof_url TEXT,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    recorded_by UUID NOT NULL,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. RECEIPTS (DIGITAL RECEIPT)
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
    receipt_number TEXT UNIQUE NOT NULL, -- RESIK/YYYY/MM/XXXXXX
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BROADCASTS & RECIPIENTS
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    target_type TEXT NOT NULL DEFAULT 'ALL', -- ALL, RW, RT, CATEGORY, CUSTOMER
    target_filter JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ
);

-- 13. ORGANIZATION LINKS (SOCIAL MEDIA & CONTACTS)
CREATE TABLE IF NOT EXISTS organization_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- WHATSAPP, INSTAGRAM, TIKTOK, FACEBOOK, WEBSITE, EMAIL, MAP
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- 14. MESSAGE TEMPLATES
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- WHATSAPP_OVERDUE_REMINDER
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- 17. CUSTOMER REGISTRATIONS (PENDAFTARAN MANDIRI WARGA)
CREATE TABLE IF NOT EXISTS customer_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    rt TEXT NOT NULL,
    rw TEXT NOT NULL,
    google_maps_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_customer_id UUID REFERENCES customers(id),
    created_customer_code TEXT
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_bills_service ON bills(service_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_period ON bills(billing_year, billing_month);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_service_locations_cust ON service_locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_customer_reg_status ON customer_registrations(status);
CREATE INDEX IF NOT EXISTS idx_customer_reg_phone ON customer_registrations(phone);

-- ROW LEVEL SECURITY (RLS) ENABLEMENT
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_registrations ENABLE ROW LEVEL SECURITY;

