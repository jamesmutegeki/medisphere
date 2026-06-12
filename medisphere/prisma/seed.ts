import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medisphere';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding MediSphere database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.insuranceClaim.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.vitalRecord.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.staffShift.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();

  const password = await hashPassword('password123');

  // ── Users ──────────────────────────────────────────────────
  const patients = await Promise.all(
    [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '555-0101' },
      { firstName: 'Emily', lastName: 'Johnson', email: 'emily.j@email.com', phone: '555-0102' },
      { firstName: 'Michael', lastName: 'Brown', email: 'michael.b@email.com', phone: '555-0103' },
      { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.w@email.com', phone: '555-0104' },
      { firstName: 'James', lastName: 'Davis', email: 'james.d@email.com', phone: '555-0105' },
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@email.com', phone: '555-0106' },
      { firstName: 'Robert', lastName: 'Kim', email: 'robert.k@email.com', phone: '555-0107' },
      { firstName: 'Linda', lastName: 'Foster', email: 'linda.f@email.com', phone: '555-0108' },
      { firstName: 'David', lastName: 'Martinez', email: 'david.m@email.com', phone: '555-0109' },
      { firstName: 'Jennifer', lastName: 'Wang', email: 'jennifer.w@email.com', phone: '555-0110' },
    ].map((p) =>
      prisma.user.create({
        data: { ...p, passwordHash: password, role: 'PATIENT', dateOfBirth: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) },
      })
    )
  );

  const doctors = await Promise.all(
    [
      { firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@medisphere.com', license: 'MD-1001', spec: 'Cardiology', dept: 'Cardiology', fee: 250 },
      { firstName: 'Michael', lastName: 'Lee', email: 'michael.lee@medisphere.com', license: 'MD-1002', spec: 'Cardiology', dept: 'Cardiology', fee: 250 },
      { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@medisphere.com', license: 'MD-1003', spec: 'Pediatrics', dept: 'Pediatrics', fee: 200 },
      { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@medisphere.com', license: 'MD-1004', spec: 'Emergency Medicine', dept: 'Emergency', fee: 300 },
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@medisphere.com', license: 'MD-1005', spec: 'Pediatrics', dept: 'Pediatrics', fee: 200 },
      { firstName: 'Robert', lastName: 'Martinez', email: 'robert.martinez@medisphere.com', license: 'MD-1006', spec: 'Surgery', dept: 'Surgery', fee: 400 },
      { firstName: 'Lisa', lastName: 'Park', email: 'lisa.park@medisphere.com', license: 'MD-1007', spec: 'Emergency Medicine', dept: 'Emergency', fee: 300 },
      { firstName: 'David', lastName: 'Kim', email: 'david.kim@medisphere.com', license: 'MD-1008', spec: 'Orthopedics', dept: 'Orthopedics', fee: 275 },
      { firstName: 'Jennifer', lastName: 'Wang', email: 'jennifer.wang@medisphere.com', license: 'MD-1009', spec: 'Surgery', dept: 'Surgery', fee: 400 },
      { firstName: 'John', lastName: 'Taylor', email: 'john.taylor@medisphere.com', license: 'MD-1010', spec: 'Neurology', dept: 'Neurology', fee: 350 },
    ].map((d) =>
      prisma.user.create({
        data: {
          firstName: d.firstName, lastName: d.lastName, email: d.email,
          passwordHash: password, role: 'DOCTOR', phone: '555-2' + Math.floor(100 + Math.random() * 900),
          doctorProfile: {
            create: { licenseNumber: d.license, specialization: d.spec, department: d.dept, consultationFee: d.fee, isAvailable: true },
          },
        },
      })
    )
  );

  const nurses = await Promise.all(
    [
      { firstName: 'Amy', lastName: 'Chen', email: 'amy.chen@medisphere.com' },
      { firstName: 'Robert', lastName: 'Taylor', email: 'robert.taylor@medisphere.com' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@medisphere.com' },
      { firstName: 'Lisa', lastName: 'Brown', email: 'lisa.brown@medisphere.com' },
      { firstName: 'Patricia', lastName: 'Moore', email: 'patricia.moore@medisphere.com' },
      { firstName: 'Christopher', lastName: 'Lee', email: 'chris.lee@medisphere.com' },
      { firstName: 'Jessica', lastName: 'Williams', email: 'jessica.w@medisphere.com' },
      { firstName: 'Daniel', lastName: 'Anderson', email: 'daniel.a@medisphere.com' },
      { firstName: 'Amanda', lastName: 'Thomas', email: 'amanda.t@medisphere.com' },
      { firstName: 'Kevin', lastName: 'Jackson', email: 'kevin.j@medisphere.com' },
    ].map((n) =>
      prisma.user.create({
        data: { ...n, passwordHash: password, role: 'NURSE', phone: '555-3' + Math.floor(100 + Math.random() * 900) },
      })
    )
  );

  const [adminUser] = await Promise.all([
    prisma.user.create({
      data: {
        firstName: 'Admin', lastName: 'User', email: 'admin@medisphere.com',
        passwordHash: password, role: 'ADMIN', phone: '555-4001',
        adminProfile: { create: { department: 'Administration', staffId: 'ADM-001' } },
      },
    }),
    prisma.user.create({
      data: {
        firstName: 'Billing', lastName: 'Officer', email: 'billing@medisphere.com',
        passwordHash: password, role: 'BILLING', phone: '555-5001',
      },
    }),
  ]);

  const allUsers = [...patients, ...doctors, ...nurses, adminUser];
  console.log(`Created ${allUsers.length} users`);

  // ── Patient Profiles ───────────────────────────────────────
  const patientProfiles = [
    { bloodType: 'A+', allergies: 'Penicillin', emergencyContact: 'Mary Smith', emergencyPhone: '555-9101', insurance: 'BlueCross', policy: 'BC-1001' },
    { bloodType: 'O+', allergies: 'None', emergencyContact: 'Tom Johnson', emergencyPhone: '555-9102', insurance: 'Aetna', policy: 'AE-1002' },
    { bloodType: 'B+', allergies: 'Sulfa', emergencyContact: 'Lisa Brown', emergencyPhone: '555-9103', insurance: 'Cigna', policy: 'CG-1003' },
    { bloodType: 'AB+', allergies: 'Latex', emergencyContact: 'Paul Wilson', emergencyPhone: '555-9104', insurance: 'UnitedHealth', policy: 'UH-1004' },
    { bloodType: 'A-', allergies: 'Ibuprofen', emergencyContact: 'Anna Davis', emergencyPhone: '555-9105', insurance: 'BlueCross', policy: 'BC-1005' },
    { bloodType: 'O-', allergies: 'None', emergencyContact: 'Carlos Garcia', emergencyPhone: '555-9106', insurance: 'Aetna', policy: 'AE-1006' },
    { bloodType: 'B-', allergies: 'Codeine', emergencyContact: 'Susan Kim', emergencyPhone: '555-9107', insurance: 'Cigna', policy: 'CG-1007' },
    { bloodType: 'AB-', allergies: 'Aspirin', emergencyContact: 'George Foster', emergencyPhone: '555-9108', insurance: 'UnitedHealth', policy: 'UH-1008' },
    { bloodType: 'A+', allergies: 'None', emergencyContact: 'Elena Martinez', emergencyPhone: '555-9109', insurance: 'BlueCross', policy: 'BC-1009' },
    { bloodType: 'O+', allergies: 'Shellfish', emergencyContact: 'Henry Wang', emergencyPhone: '555-9110', insurance: 'Aetna', policy: 'AE-1010' },
  ];

  for (let i = 0; i < patients.length; i++) {
    const p = patientProfiles[i];
    await prisma.patientProfile.update({
      where: { userId: patients[i].id },
      data: {
        bloodType: p.bloodType, allergies: p.allergies,
        emergencyContactName: p.emergencyContact, emergencyContactPhone: p.emergencyPhone,
        insuranceProvider: p.insurance, insurancePolicyNumber: p.policy,
      },
    });
  }
  console.log('Patient profiles updated');

  // ── Wards ──────────────────────────────────────────────────
  const wards = await Promise.all([
    prisma.ward.create({ data: { name: 'Emergency Room', type: 'EMERGENCY', floor: 1, wing: 'East' } }),
    prisma.ward.create({ data: { name: 'Intensive Care Unit', type: 'ICU', floor: 2, wing: 'West' } }),
    prisma.ward.create({ data: { name: 'General Ward A', type: 'GENERAL', floor: 3, wing: 'North' } }),
    prisma.ward.create({ data: { name: 'General Ward B', type: 'GENERAL', floor: 3, wing: 'South' } }),
    prisma.ward.create({ data: { name: 'Pediatrics', type: 'PEDIATRICS', floor: 4, wing: 'East' } }),
    prisma.ward.create({ data: { name: 'Maternity', type: 'MATERNITY', floor: 4, wing: 'West' } }),
    prisma.ward.create({ data: { name: 'Surgery Recovery', type: 'SURGERY', floor: 5, wing: 'North' } }),
    prisma.ward.create({ data: { name: 'Cardiology', type: 'ICU', floor: 2, wing: 'East' } }),
    prisma.ward.create({ data: { name: 'Orthopedics', type: 'GENERAL', floor: 5, wing: 'South' } }),
    prisma.ward.create({ data: { name: 'Neurology', type: 'ICU', floor: 6, wing: 'West' } }),
  ]);
  console.log(`Created ${wards.length} wards`);

  // ── Beds ───────────────────────────────────────────────────
  for (const ward of wards) {
    const bedCount = ward.type === 'ICU' ? 6 : ward.type === 'EMERGENCY' ? 8 : 10;
    for (let i = 1; i <= bedCount; i++) {
      const label = `${ward.name.split(' ')[0]}-${String(i).padStart(2, '0')}`;
      const status = i <= Math.floor(bedCount * 0.7) ? 'OCCUPIED' : Math.random() > 0.5 ? 'AVAILABLE' : 'RESERVED';
      const patientId = status === 'OCCUPIED' ? patients[(ward.id.length + i) % patients.length].id : null;
      await prisma.bed.create({
        data: {
          wardId: ward.id, bedLabel: label, status: status as any,
          patientId: patientId, assignedAt: patientId ? new Date(Date.now() - Math.random() * 7 * 86400000) : null,
        },
      });
    }
  }
  console.log('Beds created');

  // ── Appointments ──────────────────────────────────────────
  const now = new Date();
  const apptTypes = ['Checkup', 'Follow-up', 'Consultation', 'Lab Results', 'Emergency', 'Surgery Prep', 'Physical Therapy', 'Vaccination', 'Referral', 'Pre-op Assessment'];
  const statuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED'];
  const appointments = [];
  for (let i = 0; i < 10; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const dayOffset = Math.floor(i / 3);
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    const hour = 8 + (i % 8);
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    const apt = await prisma.appointment.create({
      data: {
        patientId: patient.id, doctorId: doctor.id,
        date, startTime, endTime,
        status: statuses[i % statuses.length] as any,
        type: apptTypes[i % apptTypes.length],
        notes: `Routine ${apptTypes[i % apptTypes.length].toLowerCase()} visit`,
      },
    });
    appointments.push(apt);
  }
  console.log(`Created ${appointments.length} appointments`);

  // ── Medical Records ───────────────────────────────────────
  const diagnoses = [
    'Hypertension Stage 1', 'Type 2 Diabetes', 'Acute Bronchitis', 'Sprained Ankle',
    'Seasonal Allergies', 'Migraine', 'Upper Respiratory Infection', 'Hyperlipidemia',
    'Mild Asthma', 'Gastroenteritis',
  ];
  const treatments = [
    'Prescribed Lisinopril 10mg daily. Follow up in 4 weeks.',
    'Started Metformin 500mg. Dietary counseling provided.',
    'Prescribed Amoxicillin 500mg for 7 days. Rest recommended.',
    'RICE protocol. Prescribed Ibuprofen 400mg as needed.',
    'Prescribed Cetirizine 10mg daily. Avoid triggers.',
    'Sumatriptan 50mg at onset. Sleep hygiene counseling.',
    'Rest, fluids, and OTC decongestants. Monitor fever.',
    'Prescribed Atorvastatin 20mg. Diet and exercise plan provided.',
    'Albuterol inhaler 2 puffs as needed. Peak flow monitoring.',
    'IV fluids and antiemetics. BRAT diet for 48 hours.',
  ];

  for (let i = 0; i < 10; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const daysAgo = i * 3;
    const recordDate = new Date(now.getTime() - daysAgo * 86400000);
    await prisma.medicalRecord.create({
      data: {
        patientId: patient.id, doctorId: doctor.id,
        appointmentId: appointments[i]?.id,
        diagnosis: diagnoses[i], treatment: treatments[i],
        symptoms: 'Patient presented with relevant symptoms',
        notes: `Follow-up recommended in ${i % 4 + 2} weeks`,
        recordDate,
      },
    });
  }
  console.log('Created 10 medical records');

  // ── Prescriptions ─────────────────────────────────────────
  const medications = [
    { name: 'Lisinopril 10mg', dosage: '1 tablet daily', freq: 'Once daily', duration: '30 days' },
    { name: 'Metformin 500mg', dosage: '1 tablet twice daily', freq: 'Twice daily', duration: '90 days' },
    { name: 'Amoxicillin 500mg', dosage: '1 tablet 3x daily', freq: 'Three times daily', duration: '7 days' },
    { name: 'Ibuprofen 400mg', dosage: '1 tablet as needed', freq: 'As needed', duration: '10 days' },
    { name: 'Atorvastatin 20mg', dosage: '1 tablet at night', freq: 'Once daily', duration: '90 days' },
    { name: 'Albuterol Inhaler', dosage: '2 puffs as needed', freq: 'As needed', duration: '30 days' },
    { name: 'Cetirizine 10mg', dosage: '1 tablet daily', freq: 'Once daily', duration: '30 days' },
    { name: 'Sumatriptan 50mg', dosage: '1 tablet at onset', freq: 'As needed', duration: '10 days' },
    { name: 'Metoprolol 25mg', dosage: '1 tablet twice daily', freq: 'Twice daily', duration: '90 days' },
    { name: 'Omeprazole 20mg', dosage: '1 capsule before breakfast', freq: 'Once daily', duration: '30 days' },
  ];

  for (let i = 0; i < 10; i++) {
    const med = medications[i];
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const daysAgo = i * 2;
    await prisma.prescription.create({
      data: {
        patientId: patient.id, doctorId: doctor.id,
        medication: med.name, dosage: med.dosage, frequency: med.freq,
        duration: med.duration, instructions: `Take as directed. ${Math.random() > 0.5 ? 'Take with food.' : ''}`,
        isActive: i < 7, refills: Math.floor(Math.random() * 4),
        prescribedAt: new Date(now.getTime() - daysAgo * 86400000),
      },
    });
  }
  console.log('Created 10 prescriptions');

  // ── Vital Records ─────────────────────────────────────────
  for (let i = 0; i < 10; i++) {
    const patient = patients[i % patients.length];
    const recorder = i % 2 === 0 ? nurses[i % nurses.length] : doctors[i % doctors.length];
    const daysAgo = i * 1;
    await prisma.vitalRecord.create({
      data: {
        patientId: patient.id, recordedBy: recorder.id,
        bloodPressureSystolic: 110 + Math.floor(Math.random() * 30),
        bloodPressureDiastolic: 70 + Math.floor(Math.random() * 20),
        heartRate: 65 + Math.floor(Math.random() * 25),
        temperature: 97.8 + Math.random() * 1.5,
        respiratoryRate: 14 + Math.floor(Math.random() * 6),
        oxygenSaturation: 95 + Math.floor(Math.random() * 5),
        weight: 140 + Math.floor(Math.random() * 80),
        height: 60 + Math.floor(Math.random() * 15),
        recordedAt: new Date(now.getTime() - daysAgo * 86400000),
        notes: Math.random() > 0.7 ? 'Patient vitals stable' : null,
      },
    });
  }
  console.log('Created 10 vital records');

  // ── Invoices ──────────────────────────────────────────────
  const billingUser = allUsers.find((u) => u.role === 'BILLING') || adminUser;
  const statusList = ['PAID', 'PAID', 'PAID', 'PARTIAL', 'PENDING', 'PAID', 'INSURANCE_PENDING', 'PAID', 'PENDING', 'OVERDUE'];

  for (let i = 0; i < 10; i++) {
    const patient = patients[i % patients.length];
    const consultation = 150 + Math.floor(Math.random() * 250);
    const lab = Math.random() > 0.5 ? 50 + Math.floor(Math.random() * 200) : 0;
    const medication = Math.random() > 0.3 ? 20 + Math.floor(Math.random() * 150) : 0;
    const ward = Math.random() > 0.7 ? 200 + Math.floor(Math.random() * 800) : 0;
    const total = consultation + lab + medication + ward;
    const paid = statusList[i] === 'PAID' ? total : statusList[i] === 'PARTIAL' ? total * 0.4 : 0;
    const daysAgo = i * 4;

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(2026001 + i).slice(-6)}`,
        patientId: patient.id, issuedBy: billingUser.id,
        consultationFee: consultation, labFees: lab,
        medicationFees: medication, wardCharges: ward,
        totalAmount: total, paidAmount: paid,
        status: statusList[i] as any,
        dueDate: new Date(now.getTime() + 30 * 86400000 - daysAgo * 86400000),
        createdAt: new Date(now.getTime() - daysAgo * 86400000),
      },
    });
  }
  console.log('Created 10 invoices');

  // ── Insurance Claims ──────────────────────────────────────
  const providers = ['BlueCross', 'Aetna', 'Cigna', 'UnitedHealth', 'Humana'];
  const claimStatuses = ['APPROVED', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'PAID', 'SUBMITTED', 'APPROVED', 'IN_REVIEW', 'PAID'];

  for (let i = 0; i < 10; i++) {
    const patient = patients[i % patients.length];
    const provider = providers[i % providers.length];
    const amount = 500 + Math.floor(Math.random() * 3000);
    const daysAgo = i * 5;

    await prisma.insuranceClaim.create({
      data: {
        patientId: patient.id, processedBy: billingUser.id,
        providerName: provider,
        policyNumber: `${provider.substring(0, 3).toUpperCase()}-${String(10000 + i).slice(-5)}`,
        claimAmount: amount,
        approvedAmount: claimStatuses[i] === 'APPROVED' || claimStatuses[i] === 'PAID' ? amount * (0.8 + Math.random() * 0.15) : null,
        status: claimStatuses[i] as any,
        submittedAt: new Date(now.getTime() - daysAgo * 86400000),
        decisionDate: ['APPROVED', 'PAID', 'DENIED'].includes(claimStatuses[i]) ? new Date(now.getTime() - (daysAgo - 2) * 86400000) : null,
        notes: claimStatuses[i] === 'DENIED' ? 'Claim requires additional documentation' : null,
      },
    });
  }
  console.log('Created 10 insurance claims');

  // ── Staff Shifts ──────────────────────────────────────────
  const allStaff = [...doctors, ...nurses];
  for (let i = 0; i < 10; i++) {
    const staff = allStaff[i % allStaff.length];
    const dayOffset = Math.floor(i / 3);
    const shiftDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    const startHour = i % 2 === 0 ? 7 : 15;
    const startTime = new Date(shiftDate);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(shiftDate);
    endTime.setHours(startHour + 8, 0, 0, 0);

    await prisma.staffShift.create({
      data: {
        userId: staff.id, date: shiftDate,
        startTime, endTime, role: staff.role as any,
        notes: i < 2 ? 'On-call duty' : null,
      },
    });
  }
  console.log('Created 10 staff shifts');

  // ── Audit Logs ────────────────────────────────────────────
  const actions = ['LOGIN', 'VIEW_RECORD', 'CREATE_APPOINTMENT', 'UPDATE_PRESCRIPTION', 'VIEW_VITALS', 'LOGOUT', 'VIEW_BILLING', 'UPDATE_RECORD', 'CREATE_PRESCRIPTION', 'VIEW_WARD'];
  const resources = ['session', 'medical_record', 'appointment', 'prescription', 'vital_record', 'session', 'invoice', 'medical_record', 'prescription', 'ward'];

  for (let i = 0; i < 10; i++) {
    const user = allUsers[i % allUsers.length];
    const minutesAgo = i * 30;
    await prisma.auditLog.create({
      data: {
        userId: user.id, action: actions[i],
        resource: resources[i],
        resourceId: String(1000 + i),
        details: `${actions[i].replace(/_/g, ' ').toLowerCase()} performed by ${user.firstName} ${user.lastName}`,
        createdAt: new Date(now.getTime() - minutesAgo * 60000),
      },
    });
  }
  console.log('Created 10 audit logs');

  // ── Demo login users ──────────────────────────────────────
  console.log('\n--- Demo Accounts ---');
  console.log('Admin:   admin@medisphere.com / password123');
  console.log('Billing: billing@medisphere.com / password123');
  console.log('Doctor:  sarah.chen@medisphere.com / password123');
  console.log('Nurse:   amy.chen@medisphere.com / password123');
  console.log('Patient: john.smith@email.com / password123');
  console.log('Patient: emily.j@email.com / password123');
  console.log('--- All users use password123 ---\n');

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
