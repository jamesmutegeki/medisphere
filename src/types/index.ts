export type Role = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'BILLING' | 'SUPER_ADMIN';

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profileId?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface WardData {
  id: string;
  name: string;
  type: string;
  floor?: number;
  wing?: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
}

export interface BedData {
  id: string;
  bedLabel: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  patientName?: string;
}
