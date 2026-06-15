'use client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'BILLING' | 'SUPER_ADMIN';
  avatarUrl?: string;
  nin?: string;
}

const STORAGE_KEY = 'medisphere_user';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getDisplayName(user: AuthUser): string {
  const prefix = user.role === 'DOCTOR' ? 'Dr. ' : '';
  return `${prefix}${user.firstName} ${user.lastName}`;
}
