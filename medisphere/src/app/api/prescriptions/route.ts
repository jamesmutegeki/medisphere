import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';
import { prescriptionSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireAuth();
    let prescriptions;

    if (user.role === 'PATIENT') {
      prescriptions = await prisma.prescription.findMany({
        where: { patientId: user.id, isActive: true },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { prescribedAt: 'desc' },
      });
    } else {
      prescriptions = await prisma.prescription.findMany({
        where: { isActive: true },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { prescribedAt: 'desc' },
      });
    }

    return NextResponse.json({ prescriptions });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['DOCTOR', 'NURSE']);
    const body = await request.json();
    const data = prescriptionSchema.parse(body);

    const prescription = await prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId: user.id,
        medication: data.medication,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
        refills: data.refills,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logAudit(user.id, 'CREATE', 'prescription', prescription.id);

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
