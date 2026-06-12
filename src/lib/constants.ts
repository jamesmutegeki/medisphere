import { NavItem } from '@/types';

export const APP_NAME = 'MediSphere';
export const APP_TAGLINE = 'Connected Healthcare Ecosystem';

export const ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  ADMIN: 'ADMIN',
  BILLING: 'BILLING',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'BILLING'] },
  { label: 'Appointments', href: '/dashboard/appointments', icon: 'Calendar', roles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN'] },
  { label: 'Medical Records', href: '/dashboard/records', icon: 'FileText', roles: ['DOCTOR', 'NURSE'] },
  { label: 'Prescriptions', href: '/dashboard/prescriptions', icon: 'Pill', roles: ['DOCTOR', 'NURSE', 'PATIENT'] },
  { label: 'Vitals', href: '/dashboard/vitals', icon: 'Activity', roles: ['DOCTOR', 'NURSE'] },
  { label: 'Ward Management', href: '/dashboard/wards', icon: 'Building2', roles: ['ADMIN', 'NURSE'] },
  { label: 'Staff Rota', href: '/dashboard/staff', icon: 'Users', roles: ['ADMIN'] },
  { label: 'Billing', href: '/dashboard/billing', icon: 'Receipt', roles: ['BILLING', 'PATIENT'] },
  { label: 'Insurance', href: '/dashboard/insurance', icon: 'Shield', roles: ['BILLING', 'PATIENT'] },
  { label: 'Patient Portal', href: '/dashboard/portal', icon: 'UserCircle', roles: ['PATIENT'] },
];

export const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
  'Gynecology',
  'Oncology',
  'Emergency Medicine',
  'Anesthesiology',
  'Radiology',
  'Pathology',
];

export const WARD_TYPES = [
  { value: 'EMERGENCY', label: 'Emergency Room' },
  { value: 'ICU', label: 'Intensive Care Unit' },
  { value: 'GENERAL', label: 'General Ward' },
  { value: 'PEDIATRICS', label: 'Pediatrics' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'SURGERY', label: 'Surgery' },
];
