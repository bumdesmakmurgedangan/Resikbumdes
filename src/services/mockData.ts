import {
  User, Customer, ServiceLocation, Bill, Payment, BankAccount,
  OrganizationLink, MessageTemplate, Broadcast, AuditLog,
  SystemSettings, Region, Category, Tariff, Permission, Role
} from '../types';

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  bumdesName: 'BUMDes Makmur Gedangan',
  tagline: 'Iuran Mudah, Lingkungan Bersih.',
  logoUrl: 'https://i.ibb.co.com/nNnkDbWh/Logo-Resik-dengan-R-Terbuka.webp',
  faviconUrl: 'https://i.ibb.co.com/nNnkDbWh/Logo-Resik-dengan-R-Terbuka.webp',
  address: 'Jl. Raya Gedangan No. 45, Kec. Gedangan, Kab. Sidoarjo, Jawa Timur 61254',
  phoneWhatsapp: '085150736692',
  email: 'bumdes.gedangan@gmail.com',
  website: 'https://bumdesgedangan.id',
  defaultDueDay: 10,
  qrisImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=00020101021226580014ID.LINKAJA.WWW011893600914300000000151440014ID.CO.QRIS.WWW0215ID10200212345670303UMI5204549953033605802ID5922BUMDES+MAKMUR+GEDANGAN6008SIDOARJO61056125462070703A0163041A2B',
  qrisDescription: 'Scan QRIS RESIK BUMDes Makmur Gedangan melalui BCA Mobile, BRImo, Mandiri Livin, BNI, Dana, OVO, GoPay, ShopeePay, atau LinkAja.',
  isQrisActive: true,

  // Kop Surat & Pejabat Penandatangan Laporan Cetak
  kopParentInstitution: 'PEMERINTAH KABUPATEN SIDOARJO • KECAMATAN GEDANGAN',
  kopUnitName: 'UNIT USAHA PENGELOLAAN KEBERSIHAN & PERSAMPAHAN "RESIK"',
  kopCity: 'Gedangan',
  signer1Title: 'Direktur BUMDes Makmur Gedangan',
  signer1Name: 'Joko Sutrisno, S.E.',
  signer1Id: 'NIP / ID: DIR-BUMDES-01',
  signer2Title: 'Bendahara / Petugas Operasional',
  signer2Name: 'Siti Aminah',
  signer2Id: 'Unit Usaha Persampahan RESIK'
};

export const INITIAL_PERMISSIONS: Permission[] = [
  { id: 'p1', code: 'CUSTOMER_VIEW', name: 'Lihat Pelanggan', description: 'Melihat data pelanggan dan profil' },
  { id: 'p2', code: 'CUSTOMER_CREATE', name: 'Tambah Pelanggan', description: 'Mendaftarkan pelanggan baru' },
  { id: 'p3', code: 'CUSTOMER_UPDATE', name: 'Ubah Pelanggan', description: 'Mengubah data pelanggan' },
  { id: 'p4', code: 'CUSTOMER_DELETE', name: 'Hapus/Nonaktif Pelanggan', description: 'Menonaktifkan akun pelanggan' },
  { id: 'p5', code: 'SERVICE_VIEW', name: 'Lihat Layanan', description: 'Melihat lokasi layanan pelanggan' },
  { id: 'p6', code: 'SERVICE_CREATE', name: 'Tambah Layanan', description: 'Menambah lokasi layanan' },
  { id: 'p7', code: 'SERVICE_UPDATE', name: 'Ubah Layanan', description: 'Mengubah lokasi layanan' },
  { id: 'p8', code: 'PAYMENT_CREATE', name: 'Catat Pembayaran', description: 'Mencatat pembayaran tunai' },
  { id: 'p9', code: 'PAYMENT_VERIFY', name: 'Verifikasi Pembayaran', description: 'Menyetujui / menolak pembayaran transfer/QRIS' },
  { id: 'p10', code: 'OVERDUE_VIEW', name: 'Lihat Tunggakan', description: 'Melihat daftar tunggakan pelanggan' },
  { id: 'p11', code: 'WHATSAPP_REMINDER', name: 'Kirim Pengingat WA', description: 'Membuka pengingat tagihan via WhatsApp' },
  { id: 'p12', code: 'BROADCAST_SEND', name: 'Kirim Broadcast', description: 'Membuat dan menyiarkan pengumuman' },
  { id: 'p13', code: 'REPORT_VIEW', name: 'Lihat Laporan', description: 'Melihat laporan retribusi' },
  { id: 'p14', code: 'REPORT_EXPORT', name: 'Export Laporan', description: 'Export laporan ke Excel/CSV' },
  { id: 'p15', code: 'IMPORT_DATA', name: 'Import Data', description: 'Import data pelanggan dari spreadsheet' },
  { id: 'p16', code: 'EXPORT_DATA', name: 'Export Data', description: 'Export data pelanggan & pembayaran' },
  { id: 'p17', code: 'MANAGE_TARIFF', name: 'Kelola Tarif', description: 'Mengatur kategori dan tarif iuran' },
  { id: 'p18', code: 'MANAGE_REGION', name: 'Kelola Wilayah', description: 'Mengatur RW dan RT' },
  { id: 'p19', code: 'MANAGE_BANK', name: 'Kelola Rekening', description: 'Mengatur rekening bank BUMDes' },
  { id: 'p20', code: 'MANAGE_QRIS', name: 'Kelola QRIS', description: 'Mengatur QRIS BUMDes' },
  { id: 'p21', code: 'MANAGE_SOCIAL', name: 'Kelola Media Sosial', description: 'Mengatur media sosial dan kontak' },
  { id: 'p22', code: 'MANAGE_USERS', name: 'Kelola Pengguna', description: 'Mengatur admin dan petugas' },
  { id: 'p23', code: 'MANAGE_SETTINGS', name: 'Kelola Pengaturan', description: 'Mengatur konfigurasi umum sistem' },
  { id: 'p24', code: 'VIEW_AUDIT_LOG', name: 'Lihat Audit Log', description: 'Melihat riwayat aktivitas sistem' }
];

export const INITIAL_ROLES: Role[] = [
  {
    id: 'r1',
    name: 'SUPER_ADMIN',
    description: 'Akses penuh ke seluruh modul, konfigurasi, dan audit log',
    permissions: INITIAL_PERMISSIONS.map(p => p.code)
  },
  {
    id: 'r2',
    name: 'ADMIN',
    description: 'Pengelolaan operasional, verifikasi pembayaran, reminder, dan laporan',
    permissions: [
      'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
      'SERVICE_VIEW', 'SERVICE_CREATE', 'SERVICE_UPDATE',
      'PAYMENT_CREATE', 'PAYMENT_VERIFY', 'OVERDUE_VIEW',
      'WHATSAPP_REMINDER', 'BROADCAST_SEND', 'REPORT_VIEW',
      'REPORT_EXPORT', 'IMPORT_DATA', 'EXPORT_DATA'
    ]
  },
  {
    id: 'r3',
    name: 'PETUGAS',
    description: 'Petugas lapangan untuk pencatatan pembayaran tunai dan pengecekan tagihan',
    permissions: [
      'CUSTOMER_VIEW', 'SERVICE_VIEW', 'PAYMENT_CREATE',
      'OVERDUE_VIEW', 'WHATSAPP_REMINDER'
    ]
  },
  {
    id: 'r4',
    name: 'CUSTOMER',
    description: 'Pelanggan warga BUMDes',
    permissions: []
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-superadmin',
    fullName: 'Joko Sutrisno, S.E. (Direktur BUMDes)',
    email: 'superadmin@bumdes.id',
    phone: '085150736692',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'u-admin',
    fullName: 'Siti Aminah (Admin Keuangan)',
    email: 'admin@bumdes.id',
    phone: '081234567891',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-02T08:00:00Z',
    updatedAt: '2026-01-02T08:00:00Z'
  },
  {
    id: 'u-petugas',
    fullName: 'Andi Prasetyo (Petugas Lapangan)',
    email: 'petugas@bumdes.id',
    phone: '081298765430',
    role: 'PETUGAS',
    status: 'ACTIVE',
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-05T08:00:00Z'
  }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'ba-1',
    bankName: 'Bank Jateng',
    accountNumber: '1234567890',
    accountName: 'BUMDes Makmur Gedangan',
    description: 'Rekening Operasional Kas Retribusi',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ba-2',
    bankName: 'Bank BRI',
    accountNumber: '9876543210',
    accountName: 'BUMDes Makmur Gedangan',
    description: 'Penerimaan Transfer Bank Himbara',
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ba-3',
    bankName: 'Bank Jatim',
    accountNumber: '0142987112',
    accountName: 'BUMDes Makmur Gedangan',
    description: 'Rekening Kas Desa Terpadu',
    isActive: true,
    sortOrder: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_ORGANIZATION_LINKS: OrganizationLink[] = [
  {
    id: 'ol-1',
    type: 'WHATSAPP',
    label: 'WhatsApp',
    url: 'https://wa.me/6285150736692?text=Halo%20BUMDes%20Makmur%20Gedangan%2C%20saya%20membutuhkan%20bantuan%20terkait%20akun%20RESIK.',
    icon: 'MessageSquare',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ol-2',
    type: 'INSTAGRAM',
    label: 'Instagram',
    url: 'https://instagram.com/bumdes.gedangan',
    icon: 'Instagram',
    sortOrder: 2,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ol-3',
    type: 'TIKTOK',
    label: 'TikTok',
    url: 'https://tiktok.com/@bumdesgedangan',
    icon: 'Video',
    sortOrder: 3,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ol-4',
    type: 'FACEBOOK',
    label: 'Facebook',
    url: 'https://facebook.com/bumdesgedangan',
    icon: 'Facebook',
    sortOrder: 4,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ol-5',
    type: 'WEBSITE',
    label: 'Website',
    url: 'https://bumdesgedangan.id',
    icon: 'Globe',
    sortOrder: 5,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ol-6',
    type: 'EMAIL',
    label: 'Email',
    url: 'mailto:bumdes.gedangan@gmail.com',
    icon: 'Mail',
    sortOrder: 6,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ol-7',
    type: 'MAP',
    label: 'Google Maps',
    url: 'https://maps.google.com/?q=Gedangan+Sidoarjo',
    icon: 'MapPin',
    sortOrder: 7,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'mt-1',
    type: 'WHATSAPP_OVERDUE_REMINDER',
    name: 'Pengingat Tunggakan Sopan Default',
    content: `Halo Bapak/Ibu {nama} 👋

Kami dari {nama_bumdes} ingin mengingatkan bahwa terdapat iuran layanan persampahan yang belum tercatat lunas:

{rincian_tunggakan}
Total tunggakan: {total_tunggakan}

Mohon dapat melakukan pembayaran melalui aplikasi RESIK (Transfer/QRIS) atau langsung kepada petugas/kantor BUMDes.

Jika sudah melakukan pembayaran, silakan abaikan pesan ini atau kirimkan konfirmasi kepada kami.

Terima kasih atas kerja samanya dalam menjaga lingkungan bersih Gedangan. 🌱

RESIK - {nama_bumdes}
{nomor_bumdes}`,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Rumah Tangga',
    description: 'Tempat tinggal warga individu dan keluarga',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'cat-2',
    name: 'UMKM',
    description: 'Warung, toko, kelontong, kafe kecil, dan bengkel',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'cat-3',
    name: 'Perusahaan',
    description: 'Pabrik, minimarket modern, ruko besar, dan industri',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_TARIFFS: Tariff[] = [
  {
    id: 'trf-1',
    categoryId: 'cat-1',
    amount: 20000,
    effectiveFrom: '2026-01-01',
    effectiveUntil: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'trf-2',
    categoryId: 'cat-2',
    amount: 35000,
    effectiveFrom: '2026-01-01',
    effectiveUntil: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'trf-3',
    categoryId: 'cat-3',
    amount: 100000,
    effectiveFrom: '2026-01-01',
    effectiveUntil: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_REGIONS: Region[] = [
  { id: 'reg-1', rwCode: 'RW 01', rtCode: 'RT 01', name: 'Dusun Gedangan Utara', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-2', rwCode: 'RW 01', rtCode: 'RT 02', name: 'Dusun Gedangan Utara', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-3', rwCode: 'RW 02', rtCode: 'RT 01', name: 'Dusun Gedangan Tengah', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-4', rwCode: 'RW 02', rtCode: 'RT 02', name: 'Dusun Gedangan Tengah', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-5', rwCode: 'RW 03', rtCode: 'RT 01', name: 'Dusun Makmur Asri', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-6', rwCode: 'RW 03', rtCode: 'RT 02', name: 'Dusun Makmur Asri', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-7', rwCode: 'RW 04', rtCode: 'RT 01', name: 'Dusun Krajan', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-8', rwCode: 'RW 05', rtCode: 'RT 01', name: 'Kawasan Industri Timur', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-9', rwCode: 'RW 06', rtCode: 'RT 01', name: 'Dusun Pesisir', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'reg-10', rwCode: 'RW 07', rtCode: 'RT 01', name: 'Dusun Harapan Baru', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    customerCode: 'PLG-RW03-0025',
    name: 'Budi Santoso',
    phone: '081234567890',
    address: 'Jl. Merpati No. 14, RT 01 / RW 03',
    pinHash: '1234', // In production hashed, demo plain/hashed
    isDefaultPin: true,
    status: 'ACTIVE',
    lastRemindedAt: '2026-10-07T09:43:00Z',
    lastRemindedBy: 'u-admin',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-10-07T09:43:00Z'
  },
  {
    id: 'cust-2',
    customerCode: 'PLG-RW02-0012',
    name: 'Ibu Sri Wahyuni',
    phone: '081398765432',
    address: 'Jl. Melati Blok C No. 5, RT 01 / RW 02',
    pinHash: '4321',
    isDefaultPin: false,
    status: 'ACTIVE',
    lastRemindedAt: null,
    lastRemindedBy: null,
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-01-12T08:00:00Z'
  },
  {
    id: 'cust-3',
    customerCode: 'PLG-RW01-0005',
    name: 'Bapak Joko Widodo',
    phone: '085712349876',
    address: 'Gang Mawar No. 3, RT 02 / RW 01',
    pinHash: '9999',
    isDefaultPin: false,
    status: 'ACTIVE',
    lastRemindedAt: null,
    lastRemindedBy: null,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'cust-4',
    customerCode: 'PLG-RW05-0001',
    name: 'PT Indo Makmur Sejahtera',
    phone: '081122334455',
    address: 'Kawasan Pergudangan Blok B-12, RT 01 / RW 05',
    pinHash: '5555',
    isDefaultPin: false,
    status: 'ACTIVE',
    lastRemindedAt: null,
    lastRemindedBy: null,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z'
  },
  {
    id: 'cust-5',
    customerCode: 'PLG-RW04-0019',
    name: 'Ahmad Fauzi (Tanpa WA)',
    phone: '', // Empty phone to test empty WhatsApp indicator!
    address: 'Jl. Kenanga No. 8, RT 01 / RW 04',
    pinHash: '1234',
    isDefaultPin: true,
    status: 'ACTIVE',
    lastRemindedAt: null,
    lastRemindedBy: null,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z'
  }
];

export const INITIAL_SERVICE_LOCATIONS: ServiceLocation[] = [
  // Budi Santoso has 2 service locations (Multi-service per PRD section 32)
  {
    id: 'srv-1',
    customerId: 'cust-1',
    serviceCode: 'LYN-RW03-0025-01',
    name: 'Rumah Tinggal',
    address: 'Jl. Merpati No. 14, Gedangan',
    rt: 'RT 01',
    rw: 'RW 03',
    categoryId: 'cat-1',
    tariffId: 'trf-1',
    latitude: -7.3885,
    longitude: 112.7214,
    status: 'ACTIVE',
    startDate: '2026-01-10',
    endDate: null,
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'srv-2',
    customerId: 'cust-1',
    serviceCode: 'LYN-RW03-0025-02',
    name: 'Toko Berkah Kelontong',
    address: 'Jl. Raya Pasar Gedangan No. 2',
    rt: 'RT 02',
    rw: 'RW 03',
    categoryId: 'cat-2',
    tariffId: 'trf-2',
    latitude: -7.3892,
    longitude: 112.7231,
    status: 'ACTIVE',
    startDate: '2026-01-10',
    endDate: null,
    createdAt: '2026-01-10T08:00:00Z'
  },
  // Sri Wahyuni
  {
    id: 'srv-3',
    customerId: 'cust-2',
    serviceCode: 'LYN-RW02-0012-01',
    name: 'Rumah Sri Wahyuni',
    address: 'Jl. Melati Blok C No. 5',
    rt: 'RT 01',
    rw: 'RW 02',
    categoryId: 'cat-1',
    tariffId: 'trf-1',
    latitude: -7.3861,
    longitude: 112.7198,
    status: 'ACTIVE',
    startDate: '2026-01-12',
    endDate: null,
    createdAt: '2026-01-12T08:00:00Z'
  },
  // Joko Widodo
  {
    id: 'srv-4',
    customerId: 'cust-3',
    serviceCode: 'LYN-RW01-0005-01',
    name: 'Rumah Joko Widodo',
    address: 'Gang Mawar No. 3',
    rt: 'RT 02',
    rw: 'RW 01',
    categoryId: 'cat-1',
    tariffId: 'trf-1',
    latitude: -7.3842,
    longitude: 112.7185,
    status: 'ACTIVE',
    startDate: '2026-01-15',
    endDate: null,
    createdAt: '2026-01-15T08:00:00Z'
  },
  // PT Indo Makmur
  {
    id: 'srv-5',
    customerId: 'cust-4',
    serviceCode: 'LYN-RW05-0001-01',
    name: 'Pabrik & Pergudangan Utama',
    address: 'Kawasan Pergudangan Blok B-12',
    rt: 'RT 01',
    rw: 'RW 05',
    categoryId: 'cat-3',
    tariffId: 'trf-3',
    latitude: -7.3920,
    longitude: 112.7280,
    status: 'ACTIVE',
    startDate: '2026-02-01',
    endDate: null,
    createdAt: '2026-02-01T08:00:00Z'
  },
  // Ahmad Fauzi
  {
    id: 'srv-6',
    customerId: 'cust-5',
    serviceCode: 'LYN-RW04-0019-01',
    name: 'Rumah Ahmad Fauzi',
    address: 'Jl. Kenanga No. 8',
    rt: 'RT 01',
    rw: 'RW 04',
    categoryId: 'cat-1',
    tariffId: 'trf-1',
    latitude: -7.3875,
    longitude: 112.7150,
    status: 'ACTIVE',
    startDate: '2026-02-10',
    endDate: null,
    createdAt: '2026-02-10T08:00:00Z'
  }
];

export const INITIAL_BILLS: Bill[] = [
  // Budi Santoso - Rumah Tinggal (September Overdue, Oktober Overdue)
  {
    id: 'bill-1',
    serviceId: 'srv-1',
    billingYear: 2026,
    billingMonth: 9,
    amount: 20000,
    dueDate: '2026-09-10',
    status: 'OVERDUE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-11T00:00:00Z'
  },
  {
    id: 'bill-2',
    serviceId: 'srv-1',
    billingYear: 2026,
    billingMonth: 10,
    amount: 20000,
    dueDate: '2026-10-10',
    status: 'OVERDUE',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  },
  // Budi Santoso - Toko Berkah Kelontong (Oktober Overdue)
  {
    id: 'bill-3',
    serviceId: 'srv-2',
    billingYear: 2026,
    billingMonth: 10,
    amount: 35000,
    dueDate: '2026-10-10',
    status: 'OVERDUE',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  },
  // Sri Wahyuni - Pending Verification (Uploaded proof)
  {
    id: 'bill-4',
    serviceId: 'srv-3',
    billingYear: 2026,
    billingMonth: 10,
    amount: 20000,
    dueDate: '2026-10-10',
    status: 'PENDING_VERIFICATION',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-08T14:30:00Z'
  },
  // Joko Widodo - Paid
  {
    id: 'bill-5',
    serviceId: 'srv-4',
    billingYear: 2026,
    billingMonth: 10,
    amount: 20000,
    dueDate: '2026-10-10',
    status: 'PAID',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-05T10:15:00Z'
  },
  // PT Indo Makmur - Overdue
  {
    id: 'bill-6',
    serviceId: 'srv-5',
    billingYear: 2026,
    billingMonth: 10,
    amount: 100000,
    dueDate: '2026-10-10',
    status: 'OVERDUE',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  },
  // Ahmad Fauzi - Overdue
  {
    id: 'bill-7',
    serviceId: 'srv-6',
    billingYear: 2026,
    billingMonth: 10,
    amount: 20000,
    dueDate: '2026-10-10',
    status: 'OVERDUE',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  // Sri Wahyuni pending verification
  {
    id: 'pay-1',
    billId: 'bill-4',
    amount: 20000,
    paymentMethod: 'TRANSFER',
    bankAccountId: 'ba-1',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    paymentDate: '2026-10-08T14:30:00Z',
    status: 'PENDING',
    recordedBy: 'cust-2',
    notes: 'Transfer via Bank Jateng m-Banking dari Rekening a.n. Sri Wahyuni',
    createdAt: '2026-10-08T14:30:00Z',
    updatedAt: '2026-10-08T14:30:00Z'
  },
  // Joko Widodo - Verified cash paid
  {
    id: 'pay-2',
    billId: 'bill-5',
    amount: 20000,
    paymentMethod: 'PETUGAS',
    paymentDate: '2026-10-05T10:15:00Z',
    status: 'VERIFIED',
    recordedBy: 'u-petugas',
    verifiedBy: 'u-petugas',
    verifiedAt: '2026-10-05T10:15:00Z',
    receiptNumber: 'RESIK/2026/10/000045',
    notes: 'Pembayaran tunai dijemput petugas lapangan Andi',
    createdAt: '2026-10-05T10:15:00Z',
    updatedAt: '2026-10-05T10:15:00Z'
  }
];

export const INITIAL_BROADCASTS: Broadcast[] = [
  {
    id: 'bc-1',
    title: 'Jadwal Pengangkutan Sampah Khusus Hari Libur & Idul Adha',
    message: 'Diberitahukan kepada seluruh warga Desa Gedangan bahwa jadwal pengangkutan sampah tetap berjalan normal setiap hari Selasa, Kamis, dan Sabtu. Mohon menempatkan tong sampah di depan pagar sebelum pukul 07.00 WIB.',
    createdBy: 'u-superadmin',
    createdByName: 'Direktur BUMDes Joko Sutrisno',
    createdAt: '2026-10-05T08:30:00Z',
    targetType: 'ALL',
    status: 'PUBLISHED'
  },
  {
    id: 'bc-2',
    title: 'Peluncuran Aplikasi RESIK Digitalisasi Iuran',
    message: 'Selamat datang di RESIK (Retribusi Elektronik & Sistem Informasi Kebersihan). Sekarang warga dapat mengecek status lunas, membayar via transfer/QRIS, serta mengunduh bukti setor digital.',
    createdBy: 'u-admin',
    createdByName: 'Admin Siti Aminah',
    createdAt: '2026-10-01T08:00:00Z',
    targetType: 'ALL',
    status: 'PUBLISHED'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'u-admin',
    userName: 'Siti Aminah',
    action: 'WHATSAPP_REMINDER_OPENED',
    entityType: 'CUSTOMER',
    entityId: 'cust-1',
    metadata: {
      customerCode: 'PLG-RW03-0025',
      customerName: 'Budi Santoso',
      totalOverdue: 75000,
      phone: '081234567890',
      status: 'OPENED'
    },
    createdAt: '2026-10-07T09:43:00Z'
  },
  {
    id: 'aud-2',
    userId: 'u-petugas',
    userName: 'Andi Prasetyo',
    action: 'PAYMENT_RECORDED',
    entityType: 'PAYMENT',
    entityId: 'pay-2',
    newData: {
      amount: 20000,
      method: 'PETUGAS',
      receiptNumber: 'RESIK/2026/10/000045'
    },
    createdAt: '2026-10-05T10:15:00Z'
  },
  {
    id: 'aud-3',
    userId: 'u-superadmin',
    userName: 'Joko Sutrisno',
    action: 'SETTINGS_UPDATE',
    entityType: 'BANK_ACCOUNT',
    entityId: 'ba-1',
    newData: { bankName: 'Bank Jateng', accountNumber: '1234567890' },
    createdAt: '2026-10-01T09:00:00Z'
  }
];
