import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const appointmentSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().min(1, 'Doctor is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Time is required'),
  type: z.string().min(1, 'Appointment type is required'),
  notes: z.string().optional(),
});

export const medicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  symptoms: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  recordDate: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  medication: z.string().min(1, 'Medication is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
  refills: z.number().int().min(0).default(0),
});

export const vitalSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  bloodPressureSystolic: z.number().int().min(50).max(300).optional(),
  bloodPressureDiastolic: z.number().int().min(30).max(200).optional(),
  heartRate: z.number().int().min(20).max(250).optional(),
  temperature: z.number().min(94).max(108).optional(),
  respiratoryRate: z.number().int().min(4).max(80).optional(),
  oxygenSaturation: z.number().int().min(50).max(100).optional(),
  weight: z.number().min(1).max(700).optional(),
  height: z.number().min(10).max(120).optional(),
  notes: z.string().optional(),
});

export const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  consultationFee: z.number().min(0).default(0),
  labFees: z.number().min(0).default(0),
  medicationFees: z.number().min(0).default(0),
  wardCharges: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
}).transform((data) => {
  const subtotal = data.consultationFee + data.labFees + data.medicationFees + data.wardCharges + data.otherCharges;
  const total = Math.max(0, subtotal - data.discount + data.tax);
  return { ...data, totalAmount: total };
});

export const insuranceClaimSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  providerName: z.string().min(1, 'Provider name is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  claimAmount: z.number().min(0.01, 'Claim amount must be greater than 0'),
  notes: z.string().optional(),
});

export const referralSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  department: z.string().min(1, 'Department is required'),
  priority: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

export const labResultSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  testName: z.string().min(1, 'Test name is required'),
  testCategory: z.string().min(1, 'Category is required'),
  result: z.string().min(1, 'Result is required'),
  normalRange: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const staffShiftSchema = z.object({
  userId: z.string().min(1, 'Staff member is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
}).refine(
  (data) => new Date(`1970-01-01T${data.startTime}`) < new Date(`1970-01-01T${data.endTime}`),
  { message: 'End time must be after start time', path: ['endTime'] }
);

export const leaveRequestSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.enum(['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER']).default('ANNUAL'),
  reason: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export const immunizationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  doseNumber: z.number().int().min(1).default(1),
  administrationDate: z.string().min(1, 'Date is required'),
  nextDoseDate: z.string().optional(),
  batchNumber: z.string().optional(),
  site: z.string().optional(),
  notes: z.string().optional(),
});

export const pharmacyItemSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  genericName: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  stockQuantity: z.number().int().min(0).default(0),
  unit: z.string().default('tablet'),
  reorderLevel: z.number().int().min(0).default(10),
  unitPrice: z.number().min(0).default(0),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const inventoryItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().default('piece'),
  reorderLevel: z.number().int().min(0).default(5),
  unitPrice: z.number().min(0).default(0),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expiryDate: z.string().optional(),
});
