import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Customer, RoleType } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: User | null;
  currentCustomer: Customer | null;
  role: RoleType | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isStaff: boolean;
  loginCustomer: (code: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  loginStaff: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  refreshProfile: () => void;
  rateLimitCooldownSeconds: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'resik_auth_state';
const FAILED_ATTEMPTS_KEY = 'resik_login_failed_attempts';
const MAX_ATTEMPTS = 5;
const COOLDOWN_DURATION_SEC = 30;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [rateLimitCooldownSeconds, setRateLimitCooldownSeconds] = useState<number>(0);

  // Load session from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.type === 'STAFF' && parsed.userId) {
          const user = dataService.getUsers().find(u => u.id === parsed.userId);
          if (user && user.status === 'ACTIVE') {
            setCurrentUser(user);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } else if (parsed.type === 'CUSTOMER' && parsed.customerId) {
          const customer = dataService.getCustomers().find(c => c.id === parsed.customerId);
          if (customer && customer.status === 'ACTIVE') {
            setCurrentCustomer(customer);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (rateLimitCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldownSeconds]);

  const refreshProfile = () => {
    if (currentUser) {
      const u = dataService.getUsers().find(x => x.id === currentUser.id);
      if (u) setCurrentUser({ ...u });
    }
    if (currentCustomer) {
      const c = dataService.getCustomers().find(x => x.id === currentCustomer.id);
      if (c) setCurrentCustomer({ ...c });
    }
  };

  const getFailedAttempts = () => {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > 1000 * 60 * 5) {
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        return 0;
      }
      return parsed.count || 0;
    } catch {
      return 0;
    }
  };

  const recordFailedAttempt = () => {
    const current = getFailedAttempts() + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({ count: current, timestamp: Date.now() }));
    if (current >= MAX_ATTEMPTS) {
      setRateLimitCooldownSeconds(COOLDOWN_DURATION_SEC);
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    setRateLimitCooldownSeconds(0);
  };

  // Customer Login (ID Pelanggan + 4 Digit PIN)
  const loginCustomer = async (code: string, pin: string): Promise<{ success: boolean; message?: string }> => {
    if (rateLimitCooldownSeconds > 0) {
      return {
        success: false,
        message: `Terlalu banyak percobaan gagal. Mohon tunggu ${rateLimitCooldownSeconds} detik.`
      };
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanPin = pin.trim();

    if (!cleanCode) {
      return { success: false, message: 'ID Pelanggan wajib diisi.' };
    }
    if (!cleanPin) {
      return { success: false, message: 'PIN 4-digit wajib diisi.' };
    }

    const customer = dataService.getCustomerByCode(cleanCode);
    if (!customer) {
      recordFailedAttempt();
      return { success: false, message: 'ID Pelanggan tidak ditemukan. Silakan periksa kembali atau hubungi BUMDes.' };
    }

    if (customer.status !== 'ACTIVE') {
      return { success: false, message: 'Akun pelanggan ini telah dinonaktifkan. Silakan hubungi pengurus BUMDes.' };
    }

    // Verify PIN
    if (customer.pinHash !== cleanPin) {
      recordFailedAttempt();
      dataService.logAudit(customer.id, customer.name, 'CUSTOMER_LOGIN_FAILED', 'CUSTOMER', customer.id, null, null, {
        reason: 'Invalid PIN'
      });
      return { success: false, message: 'PIN yang Anda masukkan salah. Coba lagi atau hubungi WhatsApp BUMDes jika lupa.' };
    }

    // Success
    clearFailedAttempts();
    setCurrentCustomer(customer);
    setCurrentUser(null);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ type: 'CUSTOMER', customerId: customer.id }));

    dataService.logAudit(customer.id, customer.name, 'CUSTOMER_LOGIN_SUCCESS', 'CUSTOMER', customer.id);

    return { success: true };
  };

  // Staff Login (Super Admin, Admin, Petugas)
  const loginStaff = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const users = dataService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Email petugas/admin tidak terdaftar.' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, message: 'Akun Anda berstatus nonaktif. Hubungi Super Admin.' };
    }

    // Passwords for demo:
    // superadmin@bumdes.id -> superadmin123
    // admin@bumdes.id -> admin123
    // petugas@bumdes.id -> petugas123
    const validPass = pass.length >= 6; // Simple check for demo / staff auth
    if (!validPass) {
      return { success: false, message: 'Password salah (minimal 6 karakter).' };
    }

    setCurrentUser(user);
    setCurrentCustomer(null);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ type: 'STAFF', userId: user.id }));

    dataService.logAudit(user.id, user.fullName, 'STAFF_LOGIN_SUCCESS', 'USER', user.id, null, null, {
      role: user.role
    });

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      dataService.logAudit(currentUser.id, currentUser.fullName, 'STAFF_LOGOUT', 'USER', currentUser.id);
    } else if (currentCustomer) {
      dataService.logAudit(currentCustomer.id, currentCustomer.name, 'CUSTOMER_LOGOUT', 'CUSTOMER', currentCustomer.id);
    }
    setCurrentUser(null);
    setCurrentCustomer(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Check specific user permissions
    if (currentUser.permissions && currentUser.permissions.includes(permissionCode)) {
      return true;
    }

    // Check role permissions
    const roles = dataService.getRoles();
    const roleObj = roles.find(r => r.name === currentUser.role);
    if (roleObj && roleObj.permissions.includes(permissionCode)) {
      return true;
    }

    return false;
  };

  const role: RoleType | null = currentUser ? currentUser.role : currentCustomer ? 'CUSTOMER' : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCustomer,
        role,
        isAuthenticated: Boolean(currentUser || currentCustomer),
        isCustomer: Boolean(currentCustomer),
        isStaff: Boolean(currentUser),
        loginCustomer,
        loginStaff,
        logout,
        hasPermission,
        refreshProfile,
        rateLimitCooldownSeconds
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
