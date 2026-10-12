import {
  User, Customer, ServiceLocation, Bill, Payment, BankAccount,
  OrganizationLink, MessageTemplate, Broadcast, AuditLog,
  SystemSettings, Region, Category, Tariff, Permission, Role,
  BillStatus, PaymentMethod, PaymentStatus, ImportItem, ImportError, Receipt,
  CustomerRegistration, RegistrationStatus
} from '../types';
import {
  INITIAL_SYSTEM_SETTINGS, INITIAL_PERMISSIONS, INITIAL_ROLES,
  INITIAL_USERS, INITIAL_BANK_ACCOUNTS, INITIAL_ORGANIZATION_LINKS,
  INITIAL_MESSAGE_TEMPLATES, INITIAL_CATEGORIES, INITIAL_TARIFFS,
  INITIAL_REGIONS, INITIAL_CUSTOMERS, INITIAL_SERVICE_LOCATIONS,
  INITIAL_BILLS, INITIAL_PAYMENTS, INITIAL_BROADCASTS, INITIAL_AUDIT_LOGS,
  INITIAL_CUSTOMER_REGISTRATIONS
} from './mockData';
import * as XLSX from 'xlsx';
import { parseGoogleMapsLocation } from '../utils/geoUtils';

const STORAGE_KEYS = {
  SETTINGS: 'resik_settings',
  USERS: 'resik_users',
  ROLES: 'resik_roles',
  CUSTOMERS: 'resik_customers',
  SERVICES: 'resik_services',
  BILLS: 'resik_bills',
  PAYMENTS: 'resik_payments',
  BANK_ACCOUNTS: 'resik_bank_accounts',
  REGISTRATIONS: 'resik_customer_registrations',
  ORG_LINKS: 'resik_org_links',
  TEMPLATES: 'resik_templates',
  REGIONS: 'resik_regions',
  CATEGORIES: 'resik_categories',
  TARIFFS: 'resik_tariffs',
  BROADCASTS: 'resik_broadcasts',
  AUDIT_LOGS: 'resik_audit_logs',
  RECEIPT_SEQ: 'resik_receipt_seq'
};

class DataService {
  private settings: SystemSettings;
  private users: User[];
  private roles: Role[];
  private permissions: Permission[];
  private customers: Customer[];
  private services: ServiceLocation[];
  private bills: Bill[];
  private payments: Payment[];
  private bankAccounts: BankAccount[];
  private orgLinks: OrganizationLink[];
  private templates: MessageTemplate[];
  private regions: Region[];
  private categories: Category[];
  private tariffs: Tariff[];
  private broadcasts: Broadcast[];
  private auditLogs: AuditLog[];
  private receiptSeq: number;
  private registrations: CustomerRegistration[];

  constructor() {
    this.settings = this.load(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
    if (!this.settings.appUrl) {
      this.settings.appUrl = INITIAL_SYSTEM_SETTINGS.appUrl || 'https://resik.bumdesmakmurgedangan.my.id/';
    }
    this.users = this.load(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.roles = this.load(STORAGE_KEYS.ROLES, INITIAL_ROLES);
    this.permissions = INITIAL_PERMISSIONS;
    this.customers = this.load(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    // Sanitize customers so pinHash is always string and isDefaultPin is boolean
    this.customers = this.customers.map(c => ({
      ...c,
      pinHash: c.pinHash ? String(c.pinHash).trim() : '1234',
      isDefaultPin: c.isDefaultPin ?? (c.pinHash ? String(c.pinHash).trim() === '1234' : true)
    }));
    // Ensure sample customer Budi Santoso (cust-1) always has his phone number for testing
    const budi = this.customers.find(c => c.id === 'cust-1' || c.customerCode === 'PLG-RW03-0025');
    if (budi && (!budi.phone || !budi.phone.trim())) {
      budi.phone = '081234567890';
    }
    this.services = this.load(STORAGE_KEYS.SERVICES, INITIAL_SERVICE_LOCATIONS);
    this.bills = this.load(STORAGE_KEYS.BILLS, INITIAL_BILLS);
    this.payments = this.load(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    this.bankAccounts = this.load(STORAGE_KEYS.BANK_ACCOUNTS, INITIAL_BANK_ACCOUNTS);
    this.templates = this.load(STORAGE_KEYS.TEMPLATES, INITIAL_MESSAGE_TEMPLATES);
    // Ensure new initial templates exist in cached storage
    INITIAL_MESSAGE_TEMPLATES.forEach(initTpl => {
      if (!this.templates.some(t => t.type === initTpl.type)) {
        this.templates.push({ ...initTpl });
      }
    });
    // Ensure template mt-2 uses {link_resik} if cached previously with {link_web}
    const mt2 = this.templates.find(t => t.type === 'WHATSAPP_ACCOUNT_CONFIRMATION');
    if (mt2 && mt2.content.includes('{link_web}')) {
      mt2.content = mt2.content.replace('{link_web}', '{link_resik}');
      this.save(STORAGE_KEYS.TEMPLATES, this.templates);
    }
    this.orgLinks = this.load(STORAGE_KEYS.ORG_LINKS, INITIAL_ORGANIZATION_LINKS);
    // Sanitize cached labels to clean app names
    const cleanBrandNames: Record<string, string> = {
      WHATSAPP: 'WhatsApp',
      INSTAGRAM: 'Instagram',
      TIKTOK: 'TikTok',
      FACEBOOK: 'Facebook',
      WEBSITE: 'Website',
      EMAIL: 'Email',
      MAP: 'Google Maps'
    };
    let orgLinksNeedSave = false;
    this.orgLinks = this.orgLinks.map(l => {
      if (cleanBrandNames[l.type] && l.label !== cleanBrandNames[l.type] && (
        l.label.includes('BUMDes') || l.label.includes('Resmi') || l.label.includes('Page') ||
        l.label.includes('Desa') || l.label.includes('Layanan') || l.label.includes('Kantor')
      )) {
        orgLinksNeedSave = true;
        return { ...l, label: cleanBrandNames[l.type] };
      }
      return l;
    });
    if (orgLinksNeedSave) {
      this.save(STORAGE_KEYS.ORG_LINKS, this.orgLinks);
    }
    this.regions = this.load(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
    this.categories = this.load(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.tariffs = this.load(STORAGE_KEYS.TARIFFS, INITIAL_TARIFFS);
    this.broadcasts = this.load(STORAGE_KEYS.BROADCASTS, INITIAL_BROADCASTS);
    this.auditLogs = this.load(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.receiptSeq = this.load(STORAGE_KEYS.RECEIPT_SEQ, 150);
    this.registrations = this.load(STORAGE_KEYS.REGISTRATIONS, INITIAL_CUSTOMER_REGISTRATIONS);

    // Run automatic overdue detection on initialization
    this.updateOverdueStatus();

    // Apply favicon dynamically to browser tab
    this.applyFavicon();
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Failed to parse ${key} from storage:`, e);
    }
    return defaultValue;
  }

  private save(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to storage:`, e);
    }
  }

  // Automatic overdue detection according to PRD section 39 & 116
  public updateOverdueStatus() {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    this.bills = this.bills.map(bill => {
      if (bill.status === 'UNPAID' && bill.dueDate < today) {
        changed = true;
        return { ...bill, status: 'OVERDUE' as BillStatus, updatedAt: new Date().toISOString() };
      }
      return bill;
    });

    if (changed) {
      this.save(STORAGE_KEYS.BILLS, this.bills);
    }
  }

  // ----------------------------------------------------
  // AUDIT LOGS
  // ----------------------------------------------------
  public logAudit(userId: string, userName: string, action: string, entityType: string, entityId?: string, oldData?: any, newData?: any, metadata?: any) {
    const log: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId,
      userName,
      action,
      entityType,
      entityId: entityId || null,
      oldData: oldData || null,
      newData: newData || null,
      metadata: metadata || null,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    this.save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // ----------------------------------------------------
  // SYSTEM SETTINGS & LINKS
  // ----------------------------------------------------
  public getSettings(): SystemSettings {
    return { ...INITIAL_SYSTEM_SETTINGS, ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>, actorUser: User) {
    const old = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.logAudit(actorUser.id, actorUser.fullName, 'SETTINGS_UPDATE', 'SYSTEM_SETTINGS', null, old, this.settings);
    this.applyFavicon(this.settings.faviconUrl || this.settings.logoUrl);
    return this.settings;
  }

  public applyFavicon(url?: string) {
    if (typeof document === 'undefined') return;
    const targetUrl = (url && url.trim().length > 0) ? url.trim() : (this.settings.faviconUrl || this.settings.logoUrl || INITIAL_SYSTEM_SETTINGS.faviconUrl);
    if (!targetUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = targetUrl;
  }

  public getOrganizationLinks(): OrganizationLink[] {
    return [...this.orgLinks].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getActiveOrganizationLinks(): OrganizationLink[] {
    return this.orgLinks
      .filter(l => l.isActive && l.url && l.url.trim().length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public saveOrganizationLink(link: OrganizationLink, actorUser: User) {
    const index = this.orgLinks.findIndex(l => l.id === link.id);
    if (index >= 0) {
      this.orgLinks[index] = link;
      this.logAudit(actorUser.id, actorUser.fullName, 'LINK_UPDATED', 'ORGANIZATION_LINK', link.id, null, link);
    } else {
      this.orgLinks.push(link);
      this.logAudit(actorUser.id, actorUser.fullName, 'LINK_CREATED', 'ORGANIZATION_LINK', link.id, null, link);
    }
    this.save(STORAGE_KEYS.ORG_LINKS, this.orgLinks);
    return this.orgLinks;
  }

  public deleteOrganizationLink(id: string, actorUser: User) {
    this.orgLinks = this.orgLinks.filter(l => l.id !== id);
    this.save(STORAGE_KEYS.ORG_LINKS, this.orgLinks);
    this.logAudit(actorUser.id, actorUser.fullName, 'LINK_DELETED', 'ORGANIZATION_LINK', id);
    return this.orgLinks;
  }

  // ----------------------------------------------------
  // BANK ACCOUNTS (PRD Sections 60-64)
  // ----------------------------------------------------
  public getBankAccounts(): BankAccount[] {
    return [...this.bankAccounts].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getActiveBankAccounts(): BankAccount[] {
    return this.bankAccounts.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public saveBankAccount(bank: BankAccount, actorUser: User) {
    const idx = this.bankAccounts.findIndex(b => b.id === bank.id);
    if (idx >= 0) {
      this.bankAccounts[idx] = { ...bank, updatedAt: new Date().toISOString() };
      this.logAudit(actorUser.id, actorUser.fullName, 'BANK_ACCOUNT_UPDATED', 'BANK_ACCOUNT', bank.id, null, bank);
    } else {
      const newBank = {
        ...bank,
        id: bank.id || 'ba-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.bankAccounts.push(newBank);
      this.logAudit(actorUser.id, actorUser.fullName, 'BANK_ACCOUNT_CREATED', 'BANK_ACCOUNT', newBank.id, null, newBank);
    }
    this.save(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    return this.bankAccounts;
  }

  public toggleBankAccountActive(id: string, actorUser: User) {
    const b = this.bankAccounts.find(x => x.id === id);
    if (b) {
      b.isActive = !b.isActive;
      b.updatedAt = new Date().toISOString();
      this.save(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
      this.logAudit(actorUser.id, actorUser.fullName, b.isActive ? 'BANK_ACCOUNT_ACTIVATED' : 'BANK_ACCOUNT_DEACTIVATED', 'BANK_ACCOUNT', id);
    }
    return this.bankAccounts;
  }

  // ----------------------------------------------------
  // USERS & ROLES
  // ----------------------------------------------------
  public getUsers(): User[] {
    return [...this.users];
  }

  public getRoles(): Role[] {
    return [...this.roles];
  }

  public getPermissions(): Permission[] {
    return [...this.permissions];
  }

  public saveUser(user: Partial<User>, actorUser: User): User {
    const now = new Date().toISOString();
    if (user.id && this.users.some(u => u.id === user.id)) {
      const idx = this.users.findIndex(u => u.id === user.id);
      const old = this.users[idx];
      const updated: User = {
        ...old,
        ...user,
        updatedAt: now
      };
      this.users[idx] = updated;
      this.save(STORAGE_KEYS.USERS, this.users);
      this.logAudit(actorUser.id, actorUser.fullName, 'USER_UPDATED', 'USER', updated.id, old, updated);
      return updated;
    } else {
      const newUser: User = {
        id: 'u-' + Date.now(),
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'PETUGAS',
        status: user.status || 'ACTIVE',
        permissions: user.permissions || [],
        createdAt: now,
        updatedAt: now
      };
      this.users.push(newUser);
      this.save(STORAGE_KEYS.USERS, this.users);
      this.logAudit(actorUser.id, actorUser.fullName, 'USER_CREATED', 'USER', newUser.id, null, newUser);
      return newUser;
    }
  }

  public toggleUserStatus(id: string, actorUser: User) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      user.status = newStatus;
      user.updatedAt = new Date().toISOString();
      this.save(STORAGE_KEYS.USERS, this.users);
      this.logAudit(actorUser.id, actorUser.fullName, newStatus === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'USER', id);
    }
    return this.users;
  }

  // ----------------------------------------------------
  // REGIONS, CATEGORIES, TARIFFS
  // ----------------------------------------------------
  public getRegions(): Region[] {
    return [...this.regions];
  }

  public saveRegion(region: Region, actorUser: User) {
    const idx = this.regions.findIndex(r => r.id === region.id);
    if (idx >= 0) {
      this.regions[idx] = region;
      this.logAudit(actorUser.id, actorUser.fullName, 'REGION_UPDATED', 'REGION', region.id);
    } else {
      this.regions.push(region);
      this.logAudit(actorUser.id, actorUser.fullName, 'REGION_CREATED', 'REGION', region.id);
    }
    this.save(STORAGE_KEYS.REGIONS, this.regions);
    return this.regions;
  }

  public getCategories(): Category[] {
    return [...this.categories];
  }

  public saveCategory(cat: Category, actorUser: User) {
    const idx = this.categories.findIndex(c => c.id === cat.id);
    if (idx >= 0) {
      this.categories[idx] = cat;
      this.logAudit(actorUser.id, actorUser.fullName, 'CATEGORY_UPDATED', 'CATEGORY', cat.id);
    } else {
      this.categories.push(cat);
      this.logAudit(actorUser.id, actorUser.fullName, 'CATEGORY_CREATED', 'CATEGORY', cat.id);
    }
    this.save(STORAGE_KEYS.CATEGORIES, this.categories);
    return this.categories;
  }

  public getTariffs(): Tariff[] {
    return this.tariffs.map(t => {
      const cat = this.categories.find(c => c.id === t.categoryId);
      return { ...t, categoryName: cat?.name || 'Kategori' };
    });
  }

  public saveTariff(tariff: Tariff, actorUser: User) {
    const idx = this.tariffs.findIndex(t => t.id === tariff.id);
    if (idx >= 0) {
      this.tariffs[idx] = tariff;
      this.logAudit(actorUser.id, actorUser.fullName, 'TARIFF_UPDATED', 'TARIFF', tariff.id, null, tariff);
    } else {
      this.tariffs.push(tariff);
      this.logAudit(actorUser.id, actorUser.fullName, 'TARIFF_CREATED', 'TARIFF', tariff.id, null, tariff);
    }
    this.save(STORAGE_KEYS.TARIFFS, this.tariffs);
    return this.tariffs;
  }

  public saveCategoryWithTariff(data: {
    id?: string;
    name: string;
    description?: string;
    amount: number;
    effectiveFrom?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }, actorUser: User): { category: Category; tariff: Tariff } {
    const now = new Date().toISOString();
    let catId = data.id;
    let savedCat: Category;
    let savedTariff: Tariff;

    if (catId && this.categories.some(c => c.id === catId)) {
      const cIdx = this.categories.findIndex(c => c.id === catId);
      const oldCat = { ...this.categories[cIdx] };
      savedCat = {
        ...this.categories[cIdx],
        name: data.name.trim(),
        description: data.description?.trim() || '',
        status: data.status || 'ACTIVE'
      };
      this.categories[cIdx] = savedCat;

      const tIdx = this.tariffs.findIndex(t => t.categoryId === catId);
      if (tIdx >= 0) {
        const oldTariff = { ...this.tariffs[tIdx] };
        savedTariff = {
          ...this.tariffs[tIdx],
          amount: Number(data.amount) || 0,
          effectiveFrom: data.effectiveFrom || this.tariffs[tIdx].effectiveFrom,
          status: data.status || 'ACTIVE'
        };
        this.tariffs[tIdx] = savedTariff;
        this.logAudit(actorUser.id, actorUser.fullName, 'TARIFF_UPDATED', 'TARIFF', savedTariff.id, oldTariff, savedTariff);
      } else {
        savedTariff = {
          id: 'trf-' + Date.now(),
          categoryId: catId,
          amount: Number(data.amount) || 0,
          effectiveFrom: data.effectiveFrom || '2026-01-01',
          effectiveUntil: null,
          status: data.status || 'ACTIVE',
          createdAt: now
        };
        this.tariffs.push(savedTariff);
        this.logAudit(actorUser.id, actorUser.fullName, 'TARIFF_CREATED', 'TARIFF', savedTariff.id, null, savedTariff);
      }

      this.logAudit(actorUser.id, actorUser.fullName, 'CATEGORY_UPDATED', 'CATEGORY', catId, oldCat, savedCat);
    } else {
      catId = 'cat-' + Date.now();
      savedCat = {
        id: catId,
        name: data.name.trim(),
        description: data.description?.trim() || '',
        status: data.status || 'ACTIVE',
        createdAt: now
      };
      this.categories.push(savedCat);

      savedTariff = {
        id: 'trf-' + Date.now(),
        categoryId: catId,
        amount: Number(data.amount) || 0,
        effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
        effectiveUntil: null,
        status: data.status || 'ACTIVE',
        createdAt: now
      };
      this.tariffs.push(savedTariff);

      this.logAudit(actorUser.id, actorUser.fullName, 'CATEGORY_CREATED', 'CATEGORY', catId, null, savedCat);
      this.logAudit(actorUser.id, actorUser.fullName, 'TARIFF_CREATED', 'TARIFF', savedTariff.id, null, savedTariff);
    }

    this.save(STORAGE_KEYS.CATEGORIES, this.categories);
    this.save(STORAGE_KEYS.TARIFFS, this.tariffs);
    return { category: savedCat, tariff: savedTariff };
  }

  public deleteCategory(categoryId: string, actorUser: User): { success: boolean; message?: string } {
    const isUsed = this.services.some(s => s.categoryId === categoryId);
    if (isUsed) {
      const activeCount = this.services.filter(s => s.categoryId === categoryId).length;
      return {
        success: false,
        message: `Kategori ini sedang digunakan oleh ${activeCount} lokasi layanan pelanggan. Silakan ubah status kategori menjadi NONAKTIF jika tidak ingin digunakan untuk pendaftaran baru.`
      };
    }

    const catIdx = this.categories.findIndex(c => c.id === categoryId);
    if (catIdx >= 0) {
      const deleted = this.categories.splice(catIdx, 1)[0];
      this.tariffs = this.tariffs.filter(t => t.categoryId !== categoryId);
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
      this.save(STORAGE_KEYS.TARIFFS, this.tariffs);
      this.logAudit(actorUser.id, actorUser.fullName, 'CATEGORY_DELETED', 'CATEGORY', categoryId, deleted, null);
      return { success: true };
    }

    return { success: false, message: 'Kategori tidak ditemukan' };
  }

  public toggleCategoryStatus(categoryId: string, actorUser: User) {
    const cat = this.categories.find(c => c.id === categoryId);
    if (cat) {
      cat.status = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const trf = this.tariffs.find(t => t.categoryId === categoryId);
      if (trf) {
        trf.status = cat.status;
      }
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
      this.save(STORAGE_KEYS.TARIFFS, this.tariffs);
      this.logAudit(actorUser.id, actorUser.fullName, cat.status === 'ACTIVE' ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED', 'CATEGORY', categoryId);
    }
    return this.categories;
  }

  // ----------------------------------------------------
  // CUSTOMERS & SERVICES (PRD Sections 25-35)
  // ----------------------------------------------------
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }

  public getCustomerByCode(code: string): Customer | undefined {
    return this.customers.find(c => c.customerCode.trim().toUpperCase() === code.trim().toUpperCase());
  }

  public normalizePhone(num?: string | null): string {
    if (!num) return '';
    let digits = String(num).replace(/\D/g, '');
    if (digits.startsWith('62')) {
      digits = '0' + digits.slice(2);
    } else if (digits.startsWith('8')) {
      digits = '0' + digits;
    }
    return digits;
  }

  public getCustomersByPhone(phone: string): Customer[] {
    const target = this.normalizePhone(phone);
    if (target.length < 8) return [];
    return this.customers.filter(c => c.phone && this.normalizePhone(c.phone) === target);
  }

  public getCustomerByCodeOrPhone(identifier: string): Customer | undefined {
    const trimmed = identifier.trim();
    if (!trimmed) return undefined;

    // 1. Direct match with customerCode (case-insensitive)
    const byCode = this.customers.find(
      c => c.customerCode.trim().toUpperCase() === trimmed.toUpperCase()
    );
    if (byCode) return byCode;

    // 2. Normalized phone match (supports 08xxx, 628xxx, +62 8xxx, 8xxx)
    const target = this.normalizePhone(trimmed);
    if (target.length >= 8) {
      const byPhone = this.customers.find(c => c.phone && this.normalizePhone(c.phone) === target);
      if (byPhone) return byPhone;
    }

    return undefined;
  }

  public generateCustomerCode(rw: string): string {
    const rwNum = rw.replace(/\D/g, '').padStart(2, '0');
    const prefix = `PLG-RW${rwNum}-`;
    const matching = this.customers.filter(c => c.customerCode.startsWith(prefix));
    const nextSeq = matching.length + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  public generateServiceCode(customerCode: string): string {
    const codePart = customerCode.replace('PLG-', 'LYN-');
    const existing = this.services.filter(s => s.serviceCode.startsWith(codePart));
    const nextSeq = existing.length + 1;
    return `${codePart}-${String(nextSeq).padStart(2, '0')}`;
  }

  public saveCustomer(customer: Partial<Customer>, actorUser?: User): Customer {
    const now = new Date().toISOString();
    if (customer.id && this.customers.some(c => c.id === customer.id)) {
      const idx = this.customers.findIndex(c => c.id === customer.id);
      const old = this.customers[idx];
      const updated: Customer = {
        ...old,
        ...customer,
        updatedAt: now
      };
      this.customers[idx] = updated;
      this.save(STORAGE_KEYS.CUSTOMERS, this.customers);
      if (actorUser) {
        this.logAudit(actorUser.id, actorUser.fullName, 'CUSTOMER_UPDATED', 'CUSTOMER', updated.id, old, updated);
      }
      return updated;
    } else {
      const newCustomer: Customer = {
        id: 'cust-' + Date.now(),
        customerCode: customer.customerCode || this.generateCustomerCode('01'),
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        pinHash: customer.pinHash || '1234',
        isDefaultPin: customer.isDefaultPin ?? true,
        status: customer.status || 'ACTIVE',
        lastRemindedAt: null,
        lastRemindedBy: null,
        createdAt: now,
        updatedAt: now
      };
      this.customers.push(newCustomer);
      this.save(STORAGE_KEYS.CUSTOMERS, this.customers);
      if (actorUser) {
        this.logAudit(actorUser.id, actorUser.fullName, 'CUSTOMER_CREATED', 'CUSTOMER', newCustomer.id, null, newCustomer);
      }
      return newCustomer;
    }
  }

  public toggleCustomerStatus(id: string, actorUser: User) {
    const cust = this.customers.find(c => c.id === id);
    if (cust) {
      cust.status = cust.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      cust.updatedAt = new Date().toISOString();
      this.save(STORAGE_KEYS.CUSTOMERS, this.customers);
      this.logAudit(actorUser.id, actorUser.fullName, cust.status === 'ACTIVE' ? 'CUSTOMER_ACTIVATED' : 'CUSTOMER_DEACTIVATED', 'CUSTOMER', id);
    }
    return this.customers;
  }

  public resetCustomerPin(id: string, actorUser: User): string {
    const cust = this.customers.find(c => c.id === id);
    if (!cust) throw new Error('Customer not found');
    const tempPin = '1234';
    cust.pinHash = tempPin;
    cust.isDefaultPin = true;
    cust.updatedAt = new Date().toISOString();
    this.save(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.logAudit(actorUser.id, actorUser.fullName, 'CUSTOMER_PIN_RESET', 'CUSTOMER', id, null, { tempPin });
    return tempPin;
  }

  public changeCustomerPin(customerId: string, newPin: string): boolean {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return false;
    cust.pinHash = newPin;
    cust.isDefaultPin = false;
    cust.updatedAt = new Date().toISOString();
    this.save(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.logAudit(customerId, cust.name, 'CUSTOMER_PIN_CHANGED', 'CUSTOMER', customerId);
    return true;
  }

  // ----------------------------------------------------
  // CUSTOMER REGISTRATIONS (PENDAFTARAN WARGA MANDIRI)
  // ----------------------------------------------------
  public getCustomerRegistrations(status?: RegistrationStatus): CustomerRegistration[] {
    const list = [...this.registrations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (status) {
      return list.filter(r => r.status === status);
    }
    return list;
  }

  public getPendingCustomerRegistrationsCount(): number {
    return this.registrations.filter(r => r.status === 'PENDING').length;
  }

  public createCustomerRegistration(data: {
    name: string;
    phone: string;
    address: string;
    rt: string;
    rw: string;
    googleMapsUrl?: string;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string;
  }): CustomerRegistration {
    const newReg: CustomerRegistration = {
      id: 'reg-' + Date.now(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      rt: data.rt.trim(),
      rw: data.rw.trim(),
      googleMapsUrl: data.googleMapsUrl?.trim(),
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes?.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.registrations.unshift(newReg);
    this.save(STORAGE_KEYS.REGISTRATIONS, this.registrations);
    return newReg;
  }

  public approveCustomerRegistration(
    registrationId: string,
    approvalData: {
      categoryId: string;
      tariffId: string;
      objectName?: string;
      customTariffAmount?: number;
    },
    actorUser: User
  ): { customer: Customer; service: ServiceLocation } {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Data pendaftaran tidak ditemukan');
    if (reg.status !== 'PENDING') throw new Error('Pendaftaran sudah diproses sebelumnya');

    // 1. Generate Customer Code and Create Customer
    const customerCode = this.generateCustomerCode(reg.rw);
    const newCust = this.saveCustomer({
      customerCode,
      name: reg.name,
      phone: reg.phone,
      address: reg.address,
      pinHash: '1234',
      isDefaultPin: true,
      status: 'ACTIVE'
    }, actorUser);

    // 2. Create Service Location
    const category = this.categories.find(c => c.id === approvalData.categoryId) || this.categories[0];
    const tariff = this.tariffs.find(t => t.id === approvalData.tariffId) || this.tariffs.find(t => t.categoryId === category?.id) || this.tariffs[0];

    const newService = this.saveServiceLocation({
      customerId: newCust.id,
      name: approvalData.objectName?.trim() || 'Rumah Tinggal',
      address: reg.address,
      rt: reg.rt,
      rw: reg.rw,
      categoryId: category?.id,
      tariffId: tariff?.id,
      customTariffAmount: (approvalData.customTariffAmount && Number(approvalData.customTariffAmount) > 0) ? Number(approvalData.customTariffAmount) : null,
      latitude: reg.latitude ?? undefined,
      longitude: reg.longitude ?? undefined
    }, actorUser);

    // 3. Generate initial bill for current month if needed
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const existingBill = this.bills.find(b => b.serviceId === newService.id && b.billingYear === currentYear && b.billingMonth === currentMonth);
    if (!existingBill && tariff) {
      const dueDay = this.settings.defaultDueDay || 10;
      const dueDate = new Date(currentYear, currentMonth - 1, dueDay).toISOString().split('T')[0];
      this.bills.push({
        id: 'bill-' + Date.now(),
        serviceId: newService.id,
        billingYear: currentYear,
        billingMonth: currentMonth,
        amount: tariff.amount,
        dueDate,
        status: 'UNPAID',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      this.save(STORAGE_KEYS.BILLS, this.bills);
    }

    // 4. Update registration record
    reg.status = 'APPROVED';
    reg.processedAt = now.toISOString();
    reg.processedBy = actorUser.id;
    reg.processedByName = actorUser.fullName;
    reg.createdCustomerId = newCust.id;
    reg.createdCustomerCode = customerCode;
    this.save(STORAGE_KEYS.REGISTRATIONS, this.registrations);

    this.logAudit(actorUser.id, actorUser.fullName, 'REGISTRATION_APPROVED', 'CUSTOMER', newCust.id, null, {
      registrationId,
      customerCode,
      name: reg.name
    });

    return { customer: newCust, service: newService };
  }

  public rejectCustomerRegistration(registrationId: string, reason: string, actorUser: User): CustomerRegistration {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Data pendaftaran tidak ditemukan');
    reg.status = 'REJECTED';
    reg.rejectionReason = reason;
    reg.processedAt = new Date().toISOString();
    reg.processedBy = actorUser.id;
    reg.processedByName = actorUser.fullName;
    this.save(STORAGE_KEYS.REGISTRATIONS, this.registrations);

    this.logAudit(actorUser.id, actorUser.fullName, 'REGISTRATION_REJECTED', 'REGISTRATION', registrationId, null, { reason });
    return reg;
  }

  public getServiceLocations(customerId?: string): ServiceLocation[] {
    const list = customerId ? this.services.filter(s => s.customerId === customerId) : this.services;
    return list.map(s => {
      const cust = this.customers.find(c => c.id === s.customerId);
      const cat = this.categories.find(c => c.id === s.categoryId);
      const trf = this.tariffs.find(t => t.id === s.tariffId);
      return {
        ...s,
        customerName: cust?.name,
        customerCode: cust?.customerCode,
        categoryName: cat?.name,
        tariffAmount: (s.customTariffAmount && s.customTariffAmount > 0) ? s.customTariffAmount : trf?.amount
      };
    });
  }

  public saveServiceLocation(service: Partial<ServiceLocation>, actorUser?: User): ServiceLocation {
    const now = new Date().toISOString();
    const customTariff = (service.customTariffAmount !== undefined && service.customTariffAmount !== null && Number(service.customTariffAmount) > 0)
      ? Number(service.customTariffAmount)
      : (service.customTariffAmount === null ? null : undefined);

    if (service.id && this.services.some(s => s.id === service.id)) {
      const idx = this.services.findIndex(s => s.id === service.id);
      const updated = {
        ...this.services[idx],
        ...service,
        ...(customTariff !== undefined ? { customTariffAmount: customTariff } : {})
      };
      this.services[idx] = updated;
      this.save(STORAGE_KEYS.SERVICES, this.services);

      // Sinkronkan nominal ke tagihan bulan berjalan yang masih BELUM BAYAR (UNPAID)
      const trf = this.tariffs.find(t => t.id === updated.tariffId) || this.tariffs.find(t => t.categoryId === updated.categoryId);
      const effectiveAmount = (updated.customTariffAmount && updated.customTariffAmount > 0)
        ? updated.customTariffAmount
        : (trf?.amount || 20000);
      const nowDt = new Date();
      const currentYear = nowDt.getFullYear();
      const currentMonth = nowDt.getMonth() + 1;
      const currentUnpaidBill = this.bills.find(b => b.serviceId === updated.id && b.billingYear === currentYear && b.billingMonth === currentMonth && b.status === 'UNPAID');
      if (currentUnpaidBill && currentUnpaidBill.amount !== effectiveAmount) {
        currentUnpaidBill.amount = effectiveAmount;
        currentUnpaidBill.updatedAt = now;
        this.save(STORAGE_KEYS.BILLS, this.bills);
      }

      if (actorUser) {
        this.logAudit(actorUser.id, actorUser.fullName, 'SERVICE_UPDATED', 'SERVICE_LOCATION', updated.id, null, updated);
      }
      return updated;
    } else {
      const cust = this.customers.find(c => c.id === service.customerId);
      const customerCode = cust?.customerCode || 'PLG-RW01-0001';
      const newService: ServiceLocation = {
        id: 'srv-' + Date.now(),
        customerId: service.customerId || '',
        serviceCode: service.serviceCode || this.generateServiceCode(customerCode),
        name: service.name || 'Rumah',
        address: service.address || '',
        rt: service.rt || 'RT 01',
        rw: service.rw || 'RW 01',
        categoryId: service.categoryId || 'cat-1',
        tariffId: service.tariffId || 'trf-1',
        customTariffAmount: customTariff || null,
        latitude: service.latitude ?? null,
        longitude: service.longitude ?? null,
        status: service.status || 'ACTIVE',
        startDate: service.startDate || new Date().toISOString().split('T')[0],
        endDate: service.endDate || null,
        createdAt: now
      };
      this.services.push(newService);
      this.save(STORAGE_KEYS.SERVICES, this.services);
      if (actorUser) {
        this.logAudit(actorUser.id, actorUser.fullName, 'SERVICE_CREATED', 'SERVICE_LOCATION', newService.id, null, newService);
      }

      // Auto generate current month bill for this new service
      this.ensureMonthlyBill(newService);

      return newService;
    }
  }

  // ----------------------------------------------------
  // BILLING & OVERDUE (PRD Sections 36-40, 116-118)
  // ----------------------------------------------------
  public ensureMonthlyBill(service: ServiceLocation, year = 2026, month = 10) {
    const existing = this.bills.find(b => b.serviceId === service.id && b.billingYear === year && b.billingMonth === month);
    if (!existing) {
      const trf = this.tariffs.find(t => t.id === service.tariffId);
      const amount = (service.customTariffAmount && service.customTariffAmount > 0)
        ? service.customTariffAmount
        : (trf ? trf.amount : 20000);
      const dueDay = this.settings.defaultDueDay || 10;
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
      const today = new Date().toISOString().split('T')[0];
      const status: BillStatus = today > dueDate ? 'OVERDUE' : 'UNPAID';

      const newBill: Bill = {
        id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        serviceId: service.id,
        billingYear: year,
        billingMonth: month,
        amount,
        dueDate,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.bills.push(newBill);
      this.save(STORAGE_KEYS.BILLS, this.bills);
    }
  }

  // Create Past or Manual Bill (PRD Section: Fleksibilitas Tagihan Lampau)
  public createManualBill(data: {
    serviceId: string;
    billingYear: number;
    billingMonth: number;
    amount?: number;
    status: 'PAID' | 'UNPAID' | 'OVERDUE';
    paidDate?: string;
    paymentMethod?: PaymentMethod;
    notes?: string;
  }, actorUser: User): { success: boolean; bill: Bill; payment?: Payment; receipt?: Receipt; message?: string } {
    const srv = this.services.find(s => s.id === data.serviceId);
    if (!srv) {
      throw new Error('Lokasi layanan tidak ditemukan.');
    }

    // Check duplicate
    const existing = this.bills.find(
      b => b.serviceId === data.serviceId && b.billingYear === data.billingYear && b.billingMonth === data.billingMonth
    );
    if (existing) {
      throw new Error(`Tagihan untuk periode bulan ${data.billingMonth}/${data.billingYear} pada objek ini sudah ada (${existing.status}).`);
    }

    const trf = this.tariffs.find(t => t.id === srv.tariffId);
    const standardAmount = (srv.customTariffAmount && srv.customTariffAmount > 0)
      ? srv.customTariffAmount
      : (trf ? trf.amount : 20000);
    const finalAmount = (data.amount !== undefined && data.amount > 0) ? Number(data.amount) : standardAmount;

    const dueDay = this.settings.defaultDueDay || 10;
    const dueDate = `${data.billingYear}-${String(data.billingMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const now = new Date().toISOString();

    const newBill: Bill = {
      id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      serviceId: srv.id,
      billingYear: data.billingYear,
      billingMonth: data.billingMonth,
      amount: finalAmount,
      dueDate,
      status: data.status,
      createdAt: now,
      updatedAt: now
    };

    this.bills.push(newBill);
    this.save(STORAGE_KEYS.BILLS, this.bills);

    let payment: Payment | undefined;
    let receipt: Receipt | undefined;
    if (data.status === 'PAID') {
      const receiptNumber = this.generateReceiptNumber(data.billingYear, data.billingMonth);
      payment = {
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        billId: newBill.id,
        amount: finalAmount,
        paymentMethod: data.paymentMethod || 'KANTOR',
        paymentDate: data.paidDate || now,
        status: 'VERIFIED',
        recordedBy: actorUser.id,
        recordedByName: actorUser.fullName,
        paymentProofUrl: null,
        notes: data.notes || `Pencatatan riwayat lunas (${data.billingMonth}/${data.billingYear}) dicatat oleh ${actorUser.fullName}`,
        receiptNumber,
        verifiedBy: actorUser.id,
        verifiedByName: actorUser.fullName,
        verifiedAt: data.paidDate || now,
        createdAt: data.paidDate || now,
        updatedAt: data.paidDate || now
      };
      this.payments.push(payment);
      this.save(STORAGE_KEYS.PAYMENTS, this.payments);
      receipt = this.getReceiptByPaymentId(payment.id) || undefined;
    }

    this.logAudit(actorUser.id, actorUser.fullName, 'BILL_CREATED_MANUAL', 'BILL', newBill.id, null, {
      ...newBill,
      paymentId: payment?.id
    });

    return { success: true, bill: newBill, payment, receipt };
  }

  public getBills(filter?: { customerId?: string; serviceId?: string; status?: BillStatus; month?: number; year?: number }): Bill[] {
    this.updateOverdueStatus();
    let res = [...this.bills];

    if (filter?.serviceId) {
      res = res.filter(b => b.serviceId === filter.serviceId);
    }
    if (filter?.status) {
      res = res.filter(b => b.status === filter.status);
    }
    if (filter?.month) {
      res = res.filter(b => b.billingMonth === filter.month);
    }
    if (filter?.year) {
      res = res.filter(b => b.billingYear === filter.year);
    }

    return res.map(b => {
      const srv = this.services.find(s => s.id === b.serviceId);
      const cust = srv ? this.customers.find(c => c.id === srv.customerId) : undefined;
      return {
        ...b,
        serviceCode: srv?.serviceCode,
        serviceName: srv?.name,
        customerId: srv?.customerId || '',
        customerCode: cust?.customerCode,
        customerName: cust?.name,
        customerPhone: cust?.phone
      };
    }).filter(b => {
      if (filter?.customerId) {
        return b.customerId === filter.customerId;
      }
      return true;
    });
  }

  // Get aggregated customer overdue items (PRD Sections 40, 45)
  public getOverdueCustomers() {
    this.updateOverdueStatus();
    const overdueBills = this.getBills({ status: 'OVERDUE' });
    const customerMap = new Map<string, {
      customer: Customer;
      bills: Bill[];
      totalAmount: number;
      unpaidMonths: string[];
      serviceNames: string[];
    }>();

    for (const bill of overdueBills) {
      if (!bill.customerId) continue;
      const cust = this.customers.find(c => c.id === bill.customerId);
      if (!cust) continue;

      if (!customerMap.has(cust.id)) {
        customerMap.set(cust.id, {
          customer: cust,
          bills: [],
          totalAmount: 0,
          unpaidMonths: [],
          serviceNames: []
        });
      }

      const item = customerMap.get(cust.id)!;
      item.bills.push(bill);
      item.totalAmount += Number(bill.amount);
      const monthName = this.formatMonthName(bill.billingMonth, bill.billingYear);
      if (!item.unpaidMonths.includes(monthName)) {
        item.unpaidMonths.push(monthName);
      }
      if (bill.serviceName && !item.serviceNames.includes(bill.serviceName)) {
        item.serviceNames.push(bill.serviceName);
      }
    }

    return Array.from(customerMap.values());
  }

  public formatMonthName(month: number, year: number) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[month - 1]} ${year}`;
  }

  // ----------------------------------------------------
  // PAYMENTS & VERIFICATION (PRD Sections 55-70)
  // ----------------------------------------------------
  public generateReceiptNumber(year = 2026, month = 10): string {
    this.receiptSeq += 1;
    this.save(STORAGE_KEYS.RECEIPT_SEQ, this.receiptSeq);
    const seqStr = String(this.receiptSeq).padStart(6, '0');
    return `RESIK/${year}/${String(month).padStart(2, '0')}/${seqStr}`;
  }

  public recordCashPayment(billId: string, officer: User, notes?: string): { payment: Payment; receiptNumber: string } {
    const bill = this.bills.find(b => b.id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (bill.status === 'PAID') throw new Error('Tagihan ini sudah lunas');

    const receiptNumber = this.generateReceiptNumber(bill.billingYear, bill.billingMonth);
    const now = new Date().toISOString();

    const payment: Payment = {
      id: 'pay-' + Date.now(),
      billId: bill.id,
      amount: bill.amount,
      paymentMethod: officer.role === 'PETUGAS' ? 'PETUGAS' : 'KANTOR',
      bankAccountId: null,
      paymentDate: now,
      status: 'VERIFIED',
      recordedBy: officer.id,
      recordedByName: officer.fullName,
      verifiedBy: officer.id,
      verifiedByName: officer.fullName,
      verifiedAt: now,
      receiptNumber,
      notes: notes || 'Pembayaran tunai diterima langsung',
      createdAt: now,
      updatedAt: now
    };

    this.payments.push(payment);
    this.save(STORAGE_KEYS.PAYMENTS, this.payments);

    bill.status = 'PAID';
    bill.updatedAt = now;
    this.save(STORAGE_KEYS.BILLS, this.bills);

    const srv = this.services.find(s => s.id === bill.serviceId);
    const cust = srv ? this.customers.find(c => c.id === srv.customerId) : undefined;

    this.logAudit(officer.id, officer.fullName, 'PAYMENT_CASH_CONFIRMED', 'PAYMENT', payment.id, null, {
      receiptNumber,
      amount: bill.amount,
      customerName: cust?.name,
      billPeriod: this.formatMonthName(bill.billingMonth, bill.billingYear)
    });

    return { payment, receiptNumber };
  }

  public submitTransferOrQrisPayment(
    billId: string,
    customer: Customer,
    method: 'TRANSFER' | 'QRIS',
    proofUrl: string,
    bankAccountId?: string,
    notes?: string
  ): Payment {
    const bill = this.bills.find(b => b.id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (bill.status === 'PAID') throw new Error('Tagihan ini sudah lunas');

    const now = new Date().toISOString();
    const payment: Payment = {
      id: 'pay-' + Date.now(),
      billId: bill.id,
      amount: bill.amount,
      paymentMethod: method,
      bankAccountId: bankAccountId || null,
      paymentProofUrl: proofUrl,
      paymentDate: now,
      status: 'PENDING',
      recordedBy: customer.id,
      recordedByName: customer.name,
      notes: notes || `${method} dari ${customer.name}`,
      createdAt: now,
      updatedAt: now
    };

    this.payments.push(payment);
    this.save(STORAGE_KEYS.PAYMENTS, this.payments);

    bill.status = 'PENDING_VERIFICATION';
    bill.updatedAt = now;
    this.save(STORAGE_KEYS.BILLS, this.bills);

    this.logAudit(customer.id, customer.name, 'PAYMENT_SUBMITTED_FOR_VERIFICATION', 'PAYMENT', payment.id, null, {
      method,
      amount: bill.amount,
      proofUrl
    });

    return payment;
  }

  public verifyPayment(paymentId: string, verifier: User, isApproved: boolean, rejectionReason?: string): Payment {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Pembayaran tidak ditemukan');

    const bill = this.bills.find(b => b.id === payment.billId);
    if (!bill) throw new Error('Tagihan terkait tidak ditemukan');

    const now = new Date().toISOString();

    if (isApproved) {
      const receiptNumber = this.generateReceiptNumber(bill.billingYear, bill.billingMonth);
      payment.status = 'VERIFIED';
      payment.verifiedBy = verifier.id;
      payment.verifiedByName = verifier.fullName;
      payment.verifiedAt = now;
      payment.receiptNumber = receiptNumber;
      payment.updatedAt = now;

      bill.status = 'PAID';
      bill.updatedAt = now;

      this.logAudit(verifier.id, verifier.fullName, 'PAYMENT_APPROVED', 'PAYMENT', payment.id, null, {
        receiptNumber,
        amount: payment.amount
      });
    } else {
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('Alasan penolakan wajib diisi');
      }
      payment.status = 'REJECTED';
      payment.verifiedBy = verifier.id;
      payment.verifiedByName = verifier.fullName;
      payment.verifiedAt = now;
      payment.rejectionReason = rejectionReason;
      payment.updatedAt = now;

      // Revert bill status to OVERDUE or UNPAID
      const today = new Date().toISOString().split('T')[0];
      bill.status = bill.dueDate < today ? 'OVERDUE' : 'UNPAID';
      bill.updatedAt = now;

      this.logAudit(verifier.id, verifier.fullName, 'PAYMENT_REJECTED', 'PAYMENT', payment.id, null, {
        rejectionReason,
        amount: payment.amount
      });
    }

    this.save(STORAGE_KEYS.PAYMENTS, this.payments);
    this.save(STORAGE_KEYS.BILLS, this.bills);

    return payment;
  }

  public getPayments(filter?: { status?: PaymentStatus; customerId?: string }): Payment[] {
    let list = [...this.payments];
    if (filter?.status) {
      list = list.filter(p => p.status === filter.status);
    }

    return list.map(p => {
      const bill = this.bills.find(b => b.id === p.billId);
      const srv = bill ? this.services.find(s => s.id === bill.serviceId) : undefined;
      const cust = srv ? this.customers.find(c => c.id === srv.customerId) : undefined;
      const bank = p.bankAccountId ? this.bankAccounts.find(b => b.id === p.bankAccountId) : undefined;

      return {
        ...p,
        billPeriod: bill ? this.formatMonthName(bill.billingMonth, bill.billingYear) : 'N/A',
        customerId: cust?.id,
        customerName: cust?.name,
        serviceName: srv?.name,
        bankAccountDetails: bank ? `${bank.bankName} - ${bank.accountNumber} (${bank.accountName})` : undefined
      };
    }).filter(p => {
      if (filter?.customerId) {
        return p.customerId === filter.customerId;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getReceiptByPaymentId(paymentId: string): Receipt | null {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment || !payment.receiptNumber) return null;

    const bill = this.bills.find(b => b.id === payment.billId);
    if (!bill) return null;

    const srv = this.services.find(s => s.id === bill.serviceId);
    if (!srv) return null;

    const cust = this.customers.find(c => c.id === srv.customerId);
    if (!cust) return null;

    return {
      id: 'rcp-' + payment.id,
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      customerName: cust.name,
      customerCode: cust.customerCode,
      serviceName: srv.name,
      serviceAddress: `${srv.address}, ${srv.rt} / ${srv.rw}`,
      billingPeriod: this.formatMonthName(bill.billingMonth, bill.billingYear),
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      officerName: payment.verifiedByName || payment.recordedByName || 'BUMDes Makmur Gedangan',
      createdAt: payment.verifiedAt || payment.paymentDate
    };
  }

  public getReceiptByBillId(billId: string): Receipt | null {
    const payment = this.payments.find(p => p.billId === billId && p.status === 'VERIFIED' && p.receiptNumber);
    if (!payment) return null;
    return this.getReceiptByPaymentId(payment.id);
  }

  // ----------------------------------------------------
  // WHATSAPP REMINDER ENGINE (PRD Sections 41-54, 115)
  // ----------------------------------------------------
  public getMessageTemplates(): MessageTemplate[] {
    return [...this.templates];
  }

  public saveMessageTemplate(tpl: MessageTemplate, actorUser?: User) {
    const idx = this.templates.findIndex(t => t.id === tpl.id);
    if (idx >= 0) {
      this.templates[idx] = { ...tpl, updatedAt: new Date().toISOString() };
      if (actorUser) {
        this.logAudit(actorUser.id, actorUser.fullName, 'TEMPLATE_UPDATED', 'MESSAGE_TEMPLATE', tpl.id, null, tpl);
      }
    } else {
      this.templates.push(tpl);
      if (actorUser) {
        this.logAudit(actorUser.id, actorUser.fullName, 'TEMPLATE_CREATED', 'MESSAGE_TEMPLATE', tpl.id, null, tpl);
      }
    }
    this.save(STORAGE_KEYS.TEMPLATES, this.templates);
    return this.templates;
  }

  public resetMessageTemplate(templateId: string, actorUser?: User): MessageTemplate | undefined {
    const defaultTpl = INITIAL_MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (!defaultTpl) return undefined;
    const restored: MessageTemplate = {
      ...defaultTpl,
      updatedAt: new Date().toISOString()
    };
    this.saveMessageTemplate(restored, actorUser);
    return restored;
  }

  public prepareWhatsAppAccountConfirmation(params: {
    customerName: string;
    customerCode: string;
    phone: string;
    pin?: string;
    categoryName?: string;
    address?: string;
  }): { messageText: string; waUrl: string } {
    let template = this.templates.find(t => t.isActive && t.type === 'WHATSAPP_ACCOUNT_CONFIRMATION');
    if (!template) {
      template = INITIAL_MESSAGE_TEMPLATES.find(t => t.type === 'WHATSAPP_ACCOUNT_CONFIRMATION') || this.templates[0];
    }

    const websiteUrl = this.settings.website || 'https://bumdesmakmurgedangan.my.id';
    const resikAppUrl = this.settings.appUrl || 'https://resik.bumdesmakmurgedangan.my.id/';
    const content = template?.content || '';

    const text = content
      .replace(/{nama}/g, params.customerName)
      .replace(/{id_pelanggan}/g, params.customerCode)
      .replace(/{no_hp}/g, params.phone)
      .replace(/{pin_awal}/g, params.pin || '1234')
      .replace(/{kategori}/g, params.categoryName || 'Rumah Tangga')
      .replace(/{alamat}/g, params.address || '-')
      .replace(/{nama_bumdes}/g, this.settings.bumdesName)
      .replace(/{nomor_bumdes}/g, this.settings.phoneWhatsapp)
      .replace(/{link_resik}/g, resikAppUrl)
      .replace(/{link_webapp_resik}/g, resikAppUrl)
      .replace(/{link_app}/g, resikAppUrl)
      .replace(/{link_web}/g, websiteUrl);

    let cleanPhone = params.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : '';
    return { messageText: text, waUrl };
  }

  public prepareWhatsAppReminder(customerId: string) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) throw new Error('Customer not found');

    const overdueBills = this.getBills({ customerId: cust.id, status: 'OVERDUE' });
    if (overdueBills.length === 0) {
      throw new Error('Pelanggan ini tidak memiliki tunggakan.');
    }

    // Breakdown per service location
    let totalOverdue = 0;
    const breakdownList = overdueBills.map(b => {
      totalOverdue += Number(b.amount);
      const periodName = this.formatMonthName(b.billingMonth, b.billingYear);
      return `• ${periodName} - ${b.serviceName || 'Layanan'} (Rp${Number(b.amount).toLocaleString('id-ID')})`;
    });

    const breakdownText = breakdownList.join('\n');
    const template = this.templates.find(t => t.isActive && t.type === 'WHATSAPP_OVERDUE_REMINDER') || this.templates[0];

    // Format money
    const formattedTotal = 'Rp' + totalOverdue.toLocaleString('id-ID');

    let text = template.content
      .replace(/{nama}/g, cust.name)
      .replace(/{id_pelanggan}/g, cust.customerCode)
      .replace(/{total_tunggakan}/g, formattedTotal)
      .replace(/{jumlah_tunggakan}/g, `${overdueBills.length} bulan`)
      .replace(/{rincian_tunggakan}/g, breakdownText)
      .replace(/{nama_bumdes}/g, this.settings.bumdesName)
      .replace(/{nomor_bumdes}/g, this.settings.phoneWhatsapp)
      .replace(/{link_resik}/g, this.settings.appUrl || 'https://resik.bumdesmakmurgedangan.my.id/')
      .replace(/{link_webapp_resik}/g, this.settings.appUrl || 'https://resik.bumdesmakmurgedangan.my.id/')
      .replace(/{link_app}/g, this.settings.appUrl || 'https://resik.bumdesmakmurgedangan.my.id/')
      .replace(/{link_web}/g, this.settings.website || 'https://bumdesmakmurgedangan.my.id');

    // Format phone number to international wa.me format (PRD Section 47)
    let cleanPhone = cust.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : '';

    // Check recent reminder warning (PRD Section 49)
    let recentReminderWarning: string | null = null;
    if (cust.lastRemindedAt) {
      const lastDate = new Date(cust.lastRemindedAt);
      const diffHours = Math.round((Date.now() - lastDate.getTime()) / (1000 * 3600));
      const diffDays = Math.round(diffHours / 24);
      if (diffHours < 24) {
        recentReminderWarning = `⚠️ Pelanggan ini sudah diingatkan ${diffHours} jam yang lalu.`;
      } else if (diffDays <= 3) {
        recentReminderWarning = `⚠️ Pelanggan ini sudah diingatkan ${diffDays} hari yang lalu.`;
      }
    }

    return {
      customer: cust,
      bills: overdueBills,
      totalOverdue,
      formattedTotal,
      breakdownList,
      breakdownText,
      messageText: text,
      hasPhone: Boolean(cust.phone && cust.phone.trim().length > 0),
      cleanPhone,
      waUrl,
      recentReminderWarning,
      lastRemindedAt: cust.lastRemindedAt
    };
  }

  public recordWhatsAppReminderOpened(customerId: string, actorUser: User, totalOverdue: number, messagePreview: string) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return;

    const now = new Date().toISOString();
    cust.lastRemindedAt = now;
    cust.lastRemindedBy = actorUser.id;
    cust.updatedAt = now;
    this.save(STORAGE_KEYS.CUSTOMERS, this.customers);

    this.logAudit(actorUser.id, actorUser.fullName, 'WHATSAPP_REMINDER_OPENED', 'CUSTOMER', cust.id, null, {
      customerCode: cust.customerCode,
      customerName: cust.name,
      phone: cust.phone,
      totalOverdue,
      status: 'OPENED',
      messagePreview: messagePreview.substring(0, 100) + '...'
    });
  }

  // ----------------------------------------------------
  // BROADCAST (PRD Sections 71-72)
  // ----------------------------------------------------
  public getBroadcasts(): Broadcast[] {
    return [...this.broadcasts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public sendBroadcast(title: string, message: string, targetType: any, targetFilter: any, actorUser: User): Broadcast {
    const bc: Broadcast = {
      id: 'bc-' + Date.now(),
      title,
      message,
      createdBy: actorUser.id,
      createdByName: actorUser.fullName,
      createdAt: new Date().toISOString(),
      targetType: targetType || 'ALL',
      targetFilter: targetFilter || {},
      status: 'PUBLISHED'
    };
    this.broadcasts.unshift(bc);
    this.save(STORAGE_KEYS.BROADCASTS, this.broadcasts);

    this.logAudit(actorUser.id, actorUser.fullName, 'BROADCAST_SENT', 'BROADCAST', bc.id, null, {
      title,
      targetType
    });
    return bc;
  }

  // ----------------------------------------------------
  // IMPORT & EXPORT (PRD Sections 73-78, 130)
  // ----------------------------------------------------
  public getImportTemplateData(): any[] {
    return [
      {
        'Nama Pelanggan': 'Budi Santoso',
        'No HP': '081234567890',
        'Alamat': 'Jl. Merpati No. 14',
        'RT': 'RT 01',
        'RW': 'RW 03',
        'Kategori': 'Rumah Tangga',
        'Nama Objek': 'Rumah Tinggal',
        'Tarif Bulanan': 20000,
        'Status Bayar Bulan Ini': 'LUNAS',
        'Jumlah Bulan Tunggakan Lampau': 0,
        'Titik Lokasi Google Maps': '-7.3885, 112.7214',
        'Latitude': -7.3885,
        'Longitude': 112.7214
      },
      {
        'Nama Pelanggan': 'Hj. Aminah Barokah',
        'No HP': '081377889900',
        'Alamat': 'Jl. Kenanga Blok B-4',
        'RT': 'RT 02',
        'RW': 'RW 01',
        'Kategori': 'UMKM',
        'Nama Objek': 'Kafe & Resto Berkah',
        'Tarif Bulanan': 65000,
        'Status Bayar Bulan Ini': 'BELUM BAYAR',
        'Jumlah Bulan Tunggakan Lampau': 2,
        'Titik Lokasi Google Maps': 'https://maps.google.com/?q=-7.3865,112.7190',
        'Latitude': -7.3865,
        'Longitude': 112.7190
      },
      {
        'Nama Pelanggan': 'PT Graha Abadi Sentosa',
        'No HP': '081299887766',
        'Alamat': 'Kawasan Pergudangan Blok C-10',
        'RT': 'RT 01',
        'RW': 'RW 05',
        'Kategori': 'Perusahaan',
        'Nama Objek': 'Pabrik Pengolahan Pakan',
        'Tarif Bulanan': 250000,
        'Status Bayar Bulan Ini': 'LUNAS',
        'Jumlah Bulan Tunggakan Lampau': 0,
        'Titik Lokasi Google Maps': '-7.3820, 112.7280',
        'Latitude': -7.3820,
        'Longitude': 112.7280
      }
    ];
  }

  public downloadImportTemplate() {
    const data = this.getImportTemplateData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template RESIK');
    XLSX.writeFile(workbook, 'Template_Import_Pelanggan_RESIK_BUMDes.xlsx');
  }

  public validateAndImportCustomers(rows: any[], actorUser: User): {
    total: number;
    success: number;
    failed: number;
    errors: ImportError[];
    createdCustomers: Customer[];
  } {
    const errors: ImportError[] = [];
    const createdCustomers: Customer[] = [];

    const categoriesMap = new Map(this.categories.map(c => [c.name.toLowerCase().trim(), c]));
    const tariffsList = this.tariffs;

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      const name = row['Nama Pelanggan'] || row['namaPelanggan'] || row['Nama'] || row['nama'];
      const phone = String(row['No HP'] || row['noHp'] || row['Telepon'] || row['no_hp'] || '').trim();
      const address = row['Alamat'] || row['alamat'] || '';
      const rt = row['RT'] || row['rt'] || 'RT 01';
      const rw = row['RW'] || row['rw'] || 'RW 01';
      const categoryName = (row['Kategori'] || row['kategori'] || 'Rumah Tangga').toLowerCase().trim();
      const objectName = row['Nama Objek'] || row['namaObjek'] || row['Objek'] || 'Rumah';
      const tariffRaw = row['Tarif'] || row['tarif'] || 20000;

      // Intelligent extraction of GPS coordinates from either Google Maps link/point or separate lat/lng
      let lat: number | null = null;
      let lng: number | null = null;

      const rawLat = row['Latitude'] || row['latitude'] || row['Lat'] || row['lat'];
      const rawLng = row['Longitude'] || row['longitude'] || row['Lng'] || row['lng'] || row['Long'] || row['long'];
      const gmapsRaw = row['Titik Lokasi Google Maps'] || row['Titik Lokasi'] ||
        row['Link Google Maps'] || row['Google Maps'] || row['Koordinat'] ||
        row['Koordinat Google Maps'] || row['Lokasi Google Maps'] || row['Maps'] ||
        row['titik_lokasi'] || row['link_maps'] || row['gmaps'] || '';

      if (gmapsRaw) {
        const parsed = parseGoogleMapsLocation(gmapsRaw);
        if (parsed) {
          lat = parsed.latitude;
          lng = parsed.longitude;
        }
      }

      if (lat === null && rawLat) {
        const parsed = parseGoogleMapsLocation(rawLat);
        if (parsed) {
          lat = parsed.latitude;
          lng = parsed.longitude;
        } else if (!isNaN(parseFloat(String(rawLat)))) {
          lat = parseFloat(String(rawLat));
        }
      }

      if (lng === null && rawLng) {
        const parsedLng = parseFloat(String(rawLng));
        if (!isNaN(parsedLng)) {
          lng = parsedLng;
        }
      }

      // Validation
      if (!name || String(name).trim().length < 2) {
        errors.push({
          rowNumber: rowNum,
          fieldName: 'Nama Pelanggan',
          errorMessage: 'Nama pelanggan wajib diisi minimal 2 karakter',
          rawData: row
        });
        return;
      }

      if (!address || String(address).trim().length === 0) {
        errors.push({
          rowNumber: rowNum,
          fieldName: 'Alamat',
          errorMessage: 'Alamat tempat tinggal / objek wajib diisi',
          rawData: row
        });
        return;
      }

      const category = categoriesMap.get(categoryName) || this.categories[0];
      const tariff = tariffsList.find(t => t.categoryId === category.id) || tariffsList[0];

      // Parse custom tariff amount if provided in Excel
      const rawTariff = row['Tarif Bulanan'] ?? row['Tarif'] ?? row['Tarif Retribusi'] ?? tariff.amount;
      const parsedTariff = (!isNaN(Number(rawTariff)) && Number(rawTariff) > 0) ? Number(rawTariff) : tariff.amount;
      const isCustomTariff = parsedTariff !== tariff.amount;

      // Auto generate Customer Code & initial PIN
      const customerCode = this.generateCustomerCode(rw);
      const newCust = this.saveCustomer({
        customerCode,
        name: String(name).trim(),
        phone,
        address: String(address).trim(),
        pinHash: '1234', // default PIN
        isDefaultPin: true,
        status: 'ACTIVE'
      }, actorUser);

      // Auto generate Service Location with customTariffAmount support
      const newService = this.saveServiceLocation({
        customerId: newCust.id,
        name: String(objectName).trim(),
        address: String(address).trim(),
        rt: String(rt).trim(),
        rw: String(rw).trim(),
        categoryId: category.id,
        tariffId: tariff.id,
        customTariffAmount: isCustomTariff ? parsedTariff : null,
        latitude: lat,
        longitude: lng,
        status: 'ACTIVE'
      }, actorUser);

      // Handle Status Bayar Bulan Berjalan (e.g. LUNAS vs BELUM BAYAR)
      const rawStatusBayar = String(row['Status Bayar Bulan Ini'] ?? row['Status Bayar'] ?? row['Status Pembayaran'] ?? '').trim().toUpperCase();
      const isPaidCurrentMonth = rawStatusBayar === 'LUNAS' || rawStatusBayar === 'PAID' || rawStatusBayar === 'SUDAH' || rawStatusBayar === 'SUDAH BAYAR';

      if (isPaidCurrentMonth) {
        // Cari tagihan bulan berjalan yang baru saja dibuat
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentBill = this.bills.find(b => b.serviceId === newService.id && b.billingYear === currentYear && b.billingMonth === currentMonth);
        if (currentBill) {
          currentBill.status = 'PAID';
          currentBill.updatedAt = new Date().toISOString();
          const receiptNumber = this.generateReceiptNumber(currentYear, currentMonth);
          const payment: Payment = {
            id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            billId: currentBill.id,
            amount: currentBill.amount,
            paymentMethod: 'KANTOR',
            paymentDate: new Date().toISOString(),
            status: 'VERIFIED',
            recordedBy: actorUser.id,
            recordedByName: actorUser.fullName,
            paymentProofUrl: null,
            notes: 'Pencatatan status lunas via Import Excel BUMDes',
            receiptNumber,
            verifiedBy: actorUser.id,
            verifiedByName: actorUser.fullName,
            verifiedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.payments.push(payment);
          this.save(STORAGE_KEYS.PAYMENTS, this.payments);
          this.save(STORAGE_KEYS.BILLS, this.bills);
        }
      }

      // Handle Tunggakan Lampau (Jumlah Bulan Menunggak Sebelum Bulan Ini)
      const rawTunggakan = row['Jumlah Bulan Tunggakan Lampau'] ?? row['Tunggakan Lampau'] ?? row['Tunggakan'] ?? 0;
      const overdueMonthsCount = (!isNaN(Number(rawTunggakan)) && Number(rawTunggakan) > 0)
        ? Math.min(Math.floor(Number(rawTunggakan)), 24)
        : 0;

      if (overdueMonthsCount > 0) {
        const now = new Date();
        let targetYear = now.getFullYear();
        let targetMonth = now.getMonth() + 1; // bulan berjalan (misal 10)

        for (let i = 1; i <= overdueMonthsCount; i++) {
          targetMonth -= 1;
          if (targetMonth < 1) {
            targetMonth = 12;
            targetYear -= 1;
          }
          this.createManualBill({
            serviceId: newService.id,
            billingYear: targetYear,
            billingMonth: targetMonth,
            amount: parsedTariff,
            status: 'OVERDUE'
          }, actorUser);
        }
      }

      createdCustomers.push(newCust);
    });

    this.logAudit(actorUser.id, actorUser.fullName, 'CUSTOMERS_IMPORTED', 'IMPORT', null, null, {
      total: rows.length,
      success: createdCustomers.length,
      failed: errors.length
    });

    return {
      total: rows.length,
      success: createdCustomers.length,
      failed: errors.length,
      errors,
      createdCustomers
    };
  }

  public exportCustomersToExcel() {
    const services = this.getServiceLocations();
    const rows = services.map(s => ({
      'ID Pelanggan': s.customerCode,
      'Nama Pelanggan': s.customerName,
      'Kode Layanan': s.serviceCode,
      'Nama Objek': s.name,
      'Alamat': s.address,
      'RT': s.rt,
      'RW': s.rw,
      'Kategori': s.categoryName,
      'Tarif (Rp)': s.tariffAmount,
      'Latitude': s.latitude || '',
      'Longitude': s.longitude || '',
      'Status': s.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pelanggan RESIK');
    XLSX.writeFile(workbook, `Data_Pelanggan_RESIK_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  public exportPaymentsToExcel(filteredPayments?: Payment[], periodLabel?: string) {
    const payments = filteredPayments || this.getPayments();
    const rows = payments.map(p => ({
      'No. Bukti / Kuitansi': p.receiptNumber || 'MENUNGGU',
      'Nama Pelanggan': p.customerName,
      'Objek Layanan': p.serviceName,
      'Periode Iuran': p.billPeriod,
      'Nominal (Rp)': Number(p.amount),
      'Metode Pembayaran': p.paymentMethod,
      'Status': p.status,
      'Tanggal Pembayaran': new Date(p.paymentDate).toLocaleString('id-ID'),
      'Petugas / Verifikator': p.verifiedByName || p.recordedByName || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pembayaran');
    const cleanSuffix = periodLabel ? `_${periodLabel.replace(/[\s\/\\]+/g, '_')}` : '';
    XLSX.writeFile(workbook, `Laporan_Pembayaran_RESIK${cleanSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  public exportOverdueToExcel(overdueItems: any[], periodLabel?: string) {
    const rows = overdueItems.map(item => ({
      'Kode Pelanggan': item.customer.customerCode,
      'Nama Pelanggan': item.customer.name,
      'Nomor WhatsApp': item.customer.phone || '-',
      'Alamat': item.customer.address || '-',
      'Bulan Tertunggak': item.unpaidMonths.join(', '),
      'Total Tunggakan (Rp)': item.totalAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Tunggakan');
    const cleanSuffix = periodLabel ? `_${periodLabel.replace(/[\s\/\\]+/g, '_')}` : '';
    XLSX.writeFile(workbook, `Laporan_Tunggakan_RESIK${cleanSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // ----------------------------------------------------
  // KPI / DASHBOARD SUMMARY STATS (PRD Sections 81, 84)
  // ----------------------------------------------------
  public getDashboardStats() {
    this.updateOverdueStatus();
    const activeCustomers = this.customers.filter(c => c.status === 'ACTIVE').length;
    const currentMonthBills = this.bills.filter(b => b.billingYear === 2026 && b.billingMonth === 10);
    const paidBills = currentMonthBills.filter(b => b.status === 'PAID').length;
    const pendingBills = currentMonthBills.filter(b => b.status === 'PENDING_VERIFICATION').length;
    const unpaidBills = currentMonthBills.filter(b => b.status === 'UNPAID').length;

    const overdueList = this.getOverdueCustomers();
    const totalOverdueCustomers = overdueList.length;
    let totalOverdueAmount = 0;
    overdueList.forEach(item => {
      totalOverdueAmount += item.totalAmount;
    });

    const monthPayments = this.payments.filter(p => p.status === 'VERIFIED' && p.paymentDate.startsWith('2026-10'));
    const totalRevenueThisMonth = monthPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    const remindedCount = overdueList.filter(o => Boolean(o.customer.lastRemindedAt)).length;
    const hasPhoneCount = overdueList.filter(o => Boolean(o.customer.phone && o.customer.phone.trim().length > 0)).length;

    return {
      activeCustomers,
      paidBills,
      pendingBills,
      unpaidBills,
      totalOverdueCustomers,
      totalOverdueAmount,
      totalRevenueThisMonth,
      remindedCount,
      notRemindedCount: totalOverdueCustomers - remindedCount,
      hasPhoneCount
    };
  }

  // Reset database to initial seed for testing
  public resetToDefaultSeed() {
    localStorage.clear();
    window.location.reload();
  }
}

export const dataService = new DataService();
