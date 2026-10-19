export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'PETUGAS' | 'CUSTOMER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type BillStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'OVERDUE' | 'REJECTED';

export type PaymentMethod = 'PETUGAS' | 'KANTOR' | 'TRANSFER' | 'QRIS';

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type SocialType = 'WHATSAPP' | 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'WEBSITE' | 'EMAIL' | 'MAP';

export type TemplateType = 'WHATSAPP_OVERDUE_REMINDER' | 'WHATSAPP_ACCOUNT_CONFIRMATION';

export type ReminderStatus = 'PREPARED' | 'OPENED';

export type TargetType = 'ALL' | 'RW' | 'RT' | 'CATEGORY' | 'CUSTOMER';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: RoleType;
  description: string;
  permissions: string[]; // permission codes
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleType;
  status: UserStatus;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  customerCode: string; // e.g. PLG-RW03-0025
  name: string;
  phone: string; // stored as TEXT, can be empty
  address: string;
  pinHash: string;
  isDefaultPin: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  lastRemindedAt?: string | null;
  lastRemindedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CustomerRegistration {
  id: string;
  name: string;
  phone: string;
  address: string;
  rt: string;
  rw: string;
  googleMapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
  status: RegistrationStatus;
  createdAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
  processedByName?: string | null;
  rejectionReason?: string | null;
  createdCustomerId?: string | null;
  createdCustomerCode?: string | null;
}

export interface Region {
  id: string;
  rwCode: string; // e.g. RW 01
  rtCode: string; // e.g. RT 01
  name?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string; // Rumah Tangga, UMKM, Perusahaan
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Tariff {
  id: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface ServiceLocation {
  id: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  customerStatus?: 'ACTIVE' | 'INACTIVE';
  serviceCode: string; // e.g. LYN-RW03-0025-01
  name: string; // e.g. Rumah, Toko
  address: string;
  rt: string;
  rw: string;
  categoryId: string;
  categoryName?: string;
  tariffId: string;
  tariffAmount?: number;
  customTariffAmount?: number | null; // Nominal tarif khusus per pelanggan/objek (misal UMKM / Perusahaan)
  latitude?: number | null;
  longitude?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  startDate: string;
  endDate?: string | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  serviceId: string;
  serviceCode?: string;
  serviceName?: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  customerPhone?: string;
  billingYear: number;
  billingMonth: number; // 1-12
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: BillStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string; // TEXT to preserve leading zeros
  accountName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  billId: string;
  billPeriod?: string;
  customerId?: string;
  customerName?: string;
  serviceName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: string | null;
  bankAccountDetails?: string;
  paymentProofUrl?: string | null;
  paymentDate: string;
  status: PaymentStatus;
  recordedBy: string; // User ID or 'CUSTOMER'
  recordedByName?: string;
  verifiedBy?: string | null;
  verifiedByName?: string;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  receiptNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  receiptNumber: string; // RESIK/YYYY/MM/XXXXXX
  customerName: string;
  customerCode: string;
  serviceName: string;
  serviceAddress: string;
  billingPeriod: string; // e.g. Oktober 2026
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  officerName: string;
  createdAt: string;
}

export interface OrganizationLink {
  id: string;
  type: SocialType;
  label: string;
  url: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  type: TemplateType;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  targetType: TargetType;
  targetFilter?: Record<string, any>;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface BroadcastRecipient {
  id: string;
  broadcastId: string;
  customerId: string;
  readAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: any;
  newData?: any;
  metadata?: any;
  createdAt: string;
}

export interface SystemSettings {
  bumdesName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl?: string; // URL / Data URI Favicon Tab Browser
  address: string;
  phoneWhatsapp: string;
  email: string;
  website: string; // Website Utama BUMDes (profil)
  appUrl?: string; // Subdomain Web App Layanan RESIK (https://resik.bumdesmakmurgedangan.my.id/)
  defaultDueDay: number;
  qrisImageUrl: string;
  qrisDescription: string;
  isQrisActive: boolean;

  // Mode Demo / Simulasi Akun & Login Cepat (Bisa dinonaktifkan saat Go-Live Launching)
  isDemoMode?: boolean;

  // Konfigurasi Kop Surat & Pejabat Penandatangan Laporan Cetak (Anti-Hardcode)
  kopParentInstitution?: string;
  kopUnitName?: string;
  kopCity?: string;

  // Pejabat 1: Mengetahui / Direktur BUMDes / Pimpinan
  signer1Title?: string;
  signer1Name?: string;
  signer1Id?: string;

  // Pejabat 2: Pelaksana / Bendahara / Petugas
  signer2Title?: string;
  signer2Name?: string;
  signer2Id?: string;
}

export interface ImportItem {
  namaPelanggan: string;
  noHp: string;
  alamat: string;
  rt: string;
  rw: string;
  kategori: string;
  namaObjek: string;
  tarif: number;
  latitude?: number;
  longitude?: number;
  statusBayarBulanIni?: string; // LUNAS atau BELUM BAYAR
  jumlahTunggakanLampau?: number; // Jumlah bulan tunggakan sebelum bulan ini (misal 1, 2, 3)
}

export interface ImportError {
  rowNumber: number;
  fieldName: string;
  errorMessage: string;
  rawData: any;
}

export interface AuthSession {
  type: 'STAFF' | 'CUSTOMER';
  user?: User;
  customer?: Customer;
}
