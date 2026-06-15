import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';
import { medicalRecordSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireAuth();
    let records;

    if (user.role === 'PATIENT') {
      records = await prisma.medicalRecord.findMany({
        where: { patientId: user.id },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { recordDate: 'desc' },
        take: 50,
      });
    } else {
      records = await prisma.medicalRecord.findMany({
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { recordDate: 'desc' },
        take: 50,
      });
    }

    return NextResponse.json({ records });
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
    const data = medicalRecordSchema.parse(body);

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        doctorId: user.id,
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatment: data.treatment,
        notes: data.notes,
        recordDate: data.recordDate ? new Date(data.recordDate) : undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logAudit(user.id, 'CREATE', 'medical_record', record.id);

    return NextResponse.json(record, { status: 201 });
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
