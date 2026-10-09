-- ============================================================
-- RESIK (Retribusi Elektronik & Sistem Informasi Kebersihan)
-- Seed Data BUMDes Makmur Gedangan
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Akses penuh ke seluruh konfigurasi, user, tarif, dan audit log'),
('ADMIN', 'Pengelolaan operasional, verifikasi transfer/QRIS, reminder, dan laporan'),
('PETUGAS', 'Petugas lapangan pencatatan pembayaran tunai dan cek tagihan'),
('CUSTOMER', 'Warga pelanggan BUMDes')
ON CONFLICT (name) DO NOTHING;

-- Initial Bank Accounts
INSERT INTO bank_accounts (bank_name, account_number, account_name, description, is_active, sort_order) VALUES
('Bank Jateng', '1234567890', 'BUMDes Makmur Gedangan', 'Rekening Operasional Kas Retribusi', true, 1),
('Bank BRI', '9876543210', 'BUMDes Makmur Gedangan', 'Rekening Penerimaan Himbara', true, 2),
('Bank Jatim', '0142987112', 'BUMDes Makmur Gedangan', 'Rekening Kas Terpadu', true, 3);

-- Organization Links
INSERT INTO organization_links (type, label, url, icon, sort_order, is_active) VALUES
('WHATSAPP', 'WhatsApp Resmi', 'https://wa.me/6285150736692', 'MessageSquare', 1, true),
('INSTAGRAM', 'Instagram BUMDes', 'https://instagram.com/bumdes.gedangan', 'Instagram', 2, true),
('TIKTOK', 'TikTok BUMDes', 'https://tiktok.com/@bumdesgedangan', 'Video', 3, true),
('FACEBOOK', 'Facebook Page', 'https://facebook.com/bumdesgedangan', 'Facebook', 4, true),
('WEBSITE', 'Website Desa', 'https://bumdesgedangan.id', 'Globe', 5, true),
('EMAIL', 'Email Resmi', 'mailto:bumdes.gedangan@gmail.com', 'Mail', 6, true),
('MAP', 'Lokasi Kantor', 'https://maps.google.com/?q=Gedangan+Sidoarjo', 'MapPin', 7, true);

-- Categories
INSERT INTO categories (name, description, status) VALUES
('Rumah Tangga', 'Tempat tinggal warga perorangan dan keluarga', 'ACTIVE'),
('UMKM', 'Warung makan, kios pasar, toko kelontong, kafe kecil', 'ACTIVE'),
('Perusahaan', 'Pabrik, minimarket modern, ruko besar, kawasan industri', 'ACTIVE');

-- Message Template
INSERT INTO message_templates (type, name, content, is_active) VALUES
('WHATSAPP_OVERDUE_REMINDER', 'Template Pengingat Sopan Default',
'Halo Bapak/Ibu {nama} 👋

Kami dari {nama_bumdes} ingin mengingatkan bahwa terdapat iuran layanan persampahan yang belum tercatat lunas:

{rincian_tunggakan}
Total tunggakan: {total_tunggakan}

Mohon dapat melakukan pembayaran melalui aplikasi RESIK (Transfer/QRIS) atau langsung kepada petugas/kantor BUMDes.

Jika sudah melakukan pembayaran, silakan abaikan pesan ini atau kirimkan konfirmasi kepada kami.

Terima kasih atas kerja samanya dalam menjaga lingkungan bersih Gedangan. 🌱

RESIK - {nama_bumdes}
{nomor_bumdes}', true);
