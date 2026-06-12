import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, logAudit } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, role } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'PATIENT',
        patientProfile: role === 'PATIENT' ? { create: {} } : undefined,
        doctorProfile: role === 'DOCTOR' ? {
          create: {
            licenseNumber: `TEMP-${Date.now()}`,
            specialization: 'General Medicine',
            department: 'General',
          },
        } : undefined,
        adminProfile: role === 'ADMIN' ? {
          create: {
            department: 'Administration',
            staffId: `STAFF-${Date.now()}`,
          },
        } : undefined,
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      },
    });

    await logAudit(user.id, 'CREATE', 'user', user.id, 'User registered');

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
