# RESIK (Retribusi Elektronik & Sistem Informasi Kebersihan)
### BUMDes Makmur Gedangan — Versi 4.0 Master

> **"Iuran Mudah, Lingkungan Bersih."**
> *"Sederhana untuk warga, lengkap untuk BUMDes."*

![Logo RESIK](/logo.webp)

RESIK adalah platform **Responsive Web App (Mobile-First)** terintegrasi untuk digitalisasi pengelolaan retribusi persampahan warga di lingkungan Desa Gedangan, Sidoarjo. Dirancang untuk menggantikan kartu pelanggan manual yang mudah hilang/rusak dengan sistem kartu digital dan pencatatan transaksi terpusat.

---

## 🌟 Fitur Utama (Sesuai Master PRD 4.0)

### 1. Hak Akses & Multi-Role (RBAC)
- **SUPER_ADMIN**: Akses penuh ke seluruh modul, konfigurasi operasional, rekening bank, tarif, user management, dan audit log.
- **ADMIN**: Verifikasi pembayaran transfer/QRIS, reminder WhatsApp, pencatatan pelanggan, broadcast, dan laporan keuangan.
- **PETUGAS**: Petugas lapangan untuk pencatatan pembayaran tunai, pengecekan tagihan warga, dan pengingat WA.
- **CUSTOMER (Warga)**: Login sederhana tanpa OTP menggunakan **ID Pelanggan (e.g. `PLG-RW03-0025`) + PIN 4-digit**.

### 2. Multi-Layanan dalam Satu Akun (Multi-Service)
- Satu warga dapat memiliki lebih dari satu lokasi layanan (misal: **Rumah Tinggal** + **Toko/Warung**).
- Tidak perlu membuat banyak akun; seluruh tagihan dan status muncul dalam satu dasbor.
- Format kode otomatis: ID Pelanggan `PLG-RW03-0025` -> Layanan `LYN-RW03-0025-01`, `LYN-RW03-0025-02`.

### 3. Deteksi Tunggakan Otomatis (Automatic Overdue)
- Tagihan bulanan unik (`service_id + billing_year + billing_month`).
- Bila tanggal melewati jatuh tempo (default tgl 10) dan belum lunas, otomatis berubah menjadi **OVERDUE (Menunggak)** dengan indikator visual merah.

### 4. Metode Pembayaran & Verifikasi (MVP)
- **Tunai**: Petugas atau staf kantor mencatat setoran langsung dan menerbitkan kwitansi digital seketika.
- **Transfer Bank**: Menampilkan rekening aktif BUMDes (Bank Jateng, BRI, Jatim) dengan tombol **[📋 Salin]** dan feedback clipboard.
- **QRIS Manual**: Menampilkan kode QRIS resmi BUMDes dan petunjuk scan.
- **Verifikasi**: Admin memeriksa foto bukti transfer/QRIS dengan opsi **[✓ Setujui]** (otomatis cetak resi) atau **[✕ Tolak]** dengan alasan penolakan wajib.

### 5. Bukti Pembayaran Digital (Digital Receipt)
- Format nomor bukti sah: `RESIK/YYYY/MM/XXXXXX`.
- Dilengkapi kop surat BUMDes, logo RESIK, stempel LUNAS, dan tombol **Cetak / Simpan PDF** ramah printer.

### 6. WhatsApp Reminder Otomatis
- Menggabungkan seluruh tunggakan multi-layanan pelanggan ke dalam 1 pesan pengingat sopan (*"iuran belum tercatat lunas"*).
- Tautan langsung `https://wa.me/62...`.
- Pratinjau pesan lengkap dengan tombol pembatalan dan peringatan jika pelanggan baru saja diingatkan.
- Pencatatan riwayat pengingat berstatus **OPENED** pada audit log.

### 7. Import & Export Spreadsheet
- Import data warga dari file `.xlsx` / `.csv` dengan template resmi BUMDes.
- Validasi data otomatis (nama, RW, RT, tarif, telepon, duplikasi) dan laporan hasil import (berhasil vs gagal).
- Export data pelanggan dan laporan transaksi pembayaran ke file Excel.

### 8. Peta Sebaran Lokasi Layanan (GPS)
- Peta interaktif Leaflet untuk memantau sebaran pelanggan di seluruh RW/RT.
- Filter berdasarkan RW, Kategori (Rumah Tangga, UMKM, Perusahaan), dan Status aktif.

### 9. Prinsip Anti-Hardcode (Pengaturan Super Admin)
Seluruh parameter operasional dapat diubah melalui menu Pengaturan tanpa mengubah kode program:
- Profil BUMDes (Nama, logo, alamat, WhatsApp, email, website)
- Rekening Bank (Nomor rekening tersimpan dalam format `TEXT` agar angka 0 di depan tetap aman)
- Kode QRIS manual
- Media Sosial & Kontak (WhatsApp, IG, TikTok, FB, Web, Email, Google Maps)
- Wilayah RW dan RT
- Kategori dan Tarif berlaku
- Tanggal jatuh tempo
- Template pesan WhatsApp
- Manajemen staf & hak akses

### 10. Audit Log Terpadu
- Seluruh aktivitas penting (login gagal, verifikasi pembayaran, reminder WA, perubahan rekening/tarif, reset PIN) tercatat permanen dengan metadata JSON.

---

## 🔑 Akun Uji Coba Cepat (Demo Simulation)

Aplikasi dilengkapi tombol **"Simulasi Akun"** di pojok kanan atas untuk berpindah role secara instan:

| Role | Identitas Login | PIN / Password | Keterangan |
|------|-----------------|----------------|------------|
| **Warga (Multi-Layanan)** | `PLG-RW03-0025` | `1234` | Budi Santoso (Rumah & Toko - ada tunggakan) |
| **Warga (Pending Verif)** | `PLG-RW02-0012` | `4321` | Ibu Sri Wahyuni (Menunggu verifikasi transfer) |
| **Warga (Lunas)** | `PLG-RW01-0005` | `9999` | Bapak Joko Widodo (Sudah lunas, ada bukti setor) |
| **Super Admin** | `superadmin@bumdes.id` | `superadmin123` | Pak Joko Sutrisno (Akses penuh & pengaturan) |
| **Admin Keuangan** | `admin@bumdes.id` | `admin123` | Ibu Siti Aminah (Verifikasi & reminder WA) |
| **Petugas Lapangan** | `petugas@bumdes.id` | `petugas123` | Andi Prasetyo (Pencatatan tunai) |

---

## 🛠️ Panduan Menjalankan Aplikasi

### Persyaratan Sistem
- Node.js (v18 ke atas)
- NPM

### Instalasi & Menjalankan Development Server
```bash
# Clone atau buka direktori proyek
cd "d:\CODEX\antigrafity\revik bumdes v4"

# Jalankan server pengembangan Vite
npm run dev
```

Buka browser di alamat: `http://localhost:5173`

### Production Build
```bash
npm run build
```
File build siap dideploy akan berada di folder `dist/`.

---

## 🗄️ Backend Supabase & PostgreSQL

Proyek ini telah dilengkapi file migrasi SQL lengkap:
- `supabase/schema.sql`: Skema tabel relasional, constraint, index, dan Row Level Security (RLS).
- `supabase/seed.sql`: Data awal BUMDes Makmur Gedangan (rekening, sosmed, tarif, kategori, role).

Untuk menghubungkan dengan proyek Supabase Anda:
1. Jalankan isi `supabase/schema.sql` dan `supabase/seed.sql` di SQL Editor dashboard Supabase Anda.
2. Salin URL Project dan Anon Key ke menu **Pengaturan -> Koneksi Supabase** di dalam aplikasi, atau buat file `.env` mengacu pada `.env.example`.
3. Secara default, jika Supabase belum dikonfigurasi, aplikasi berjalan mulus menggunakan **Local Storage Engine** bawaan dengan data simulasi realistis!
