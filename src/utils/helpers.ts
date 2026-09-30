/**
 * Utility helpers for dates, certificate status, tokens, masking, and formatting
 */
import { CertificateStatus } from '../types';

/**
 * Extract public token from any input format:
 * - Raw token: "A7K9X2M8"
 * - Full URL: "https://hoso.skypec.vn/q/A7K9X2M8"
 * - App URL: "https://ais-dev-...run.app/?token=A7K9X2M8"
 * - Path: "/q/A7K9X2M8"
 * - Hash: "#q/A7K9X2M8"
 */
export function extractToken(input: string): string {
  if (!input) return '';
  let str = input.trim();

  try {
    if (str.startsWith('http://') || str.startsWith('https://')) {
      const url = new URL(str);
      const tokenParam = url.searchParams.get('token') || url.searchParams.get('q');
      if (tokenParam) return tokenParam.trim().toUpperCase();

      if (url.hash && url.hash.includes('q/')) {
        const parts = url.hash.split('q/');
        const t = parts[parts.length - 1].split(/[?#&/]/)[0];
        if (t) return t.trim().toUpperCase();
      }

      const pathSegments = url.pathname.split('/').filter(Boolean);
      const qIndex = pathSegments.indexOf('q');
      if (qIndex !== -1 && pathSegments[qIndex + 1]) {
        return pathSegments[qIndex + 1].split(/[?#&/]/)[0].trim().toUpperCase();
      }
      if (pathSegments.length > 0) {
        const last = pathSegments[pathSegments.length - 1].split(/[?#&/]/)[0];
        if (last && last.length >= 4 && last.length <= 20) {
          return last.trim().toUpperCase();
        }
      }
    }
  } catch (e) {
    // continue with string regex fallback
  }

  // Check /q/TOKEN
  if (str.includes('/q/')) {
    const afterQ = str.split('/q/')[1];
    const token = afterQ.split(/[?#&/]/)[0];
    if (token) return token.trim().toUpperCase();
  }

  // Check ?token=TOKEN or ?q=TOKEN
  if (str.includes('token=')) {
    const afterToken = str.split('token=')[1];
    const token = afterToken.split(/[?#&/]/)[0];
    if (token) return token.trim().toUpperCase();
  }
  if (str.includes('q=')) {
    const afterQ = str.split('q=')[1];
    const token = afterQ.split(/[?#&/]/)[0];
    if (token) return token.trim().toUpperCase();
  }

  // Check hash #q/TOKEN
  if (str.includes('#q/')) {
    const afterHash = str.split('#q/')[1];
    const token = afterHash.split(/[?#&/]/)[0];
    if (token) return token.trim().toUpperCase();
  }

  return str.split(/[?#&/]/)[0].trim().toUpperCase();
}

/**
 * Generate a random 8-10 character cryptographically clean Public Token
 * (like 'A7K9X2M8')
 */
export function generatePublicToken(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Parse date string from YYYY-MM-DD or DD/MM/YYYY to Date object
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Check if DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  // Check if YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format Date to standard Vietnamese DD/MM/YYYY
 */
export function formatDateVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  if (typeof dateInput === 'string') {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput.trim())) {
      return dateInput.trim();
    }
  }
  const date = typeof dateInput === 'string' ? parseDate(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate certificate status relative to today and warning threshold
 */
export function getCertificateStatus(
  expiryDateStr: string,
  warningDays: number = 60,
  referenceDate: Date = new Date()
): {
  status: CertificateStatus;
  daysRemaining: number;
  label: string;
  badgeClass: string;
} {
  const expiry = parseDate(expiryDateStr);
  if (!expiry) {
    return {
      status: 'valid',
      daysRemaining: 9999,
      label: 'Vô thời hạn / Chưa rõ',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }

  // Normalize to midnight
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const expMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

  const diffTime = expMidnight.getTime() - refMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      daysRemaining: diffDays,
      label: `Đã hết hạn (${Math.abs(diffDays)} ngày trước)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }

  if (diffDays <= warningDays) {
    return {
      status: 'expiring',
      daysRemaining: diffDays,
      label: `Sắp hết hạn (còn ${diffDays} ngày)`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }

  return {
    status: 'valid',
    daysRemaining: diffDays,
    label: `Còn hiệu lực (${diffDays} ngày)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
}

/**
 * Mask Citizen Identity Card (CCCN/CCCD) for privacy protection
 * Example: "079201004589" -> "0792******89"
 */
export function maskIdCard(idNumber: string, mask: boolean = true): string {
  if (!idNumber) return '—';
  if (!mask) return idNumber;
  const clean = idNumber.replace(/\s+/g, '');
  if (clean.length <= 6) return clean.replace(/.(?=.{2})/g, '*');
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-2);
  const stars = '*'.repeat(Math.max(4, clean.length - 6));
  return `${prefix}${stars}${suffix}`;
}

/**
 * Map employee status to badge info
 */
export function getEmployeeStatusInfo(status: string): { label: string; colorClass: string } {
  switch (status) {
    case 'active':
      return { label: 'Đang làm việc', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'suspended':
      return { label: 'Tạm hoãn', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'resigned':
      return { label: 'Nghỉ việc', colorClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'locked':
      return { label: 'Hồ sơ khóa', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: 'Không xác định', colorClass: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}
