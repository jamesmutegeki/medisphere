import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';
import { vitalSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireAuth();
    let vitals;

    if (user.role === 'PATIENT') {
      vitals = await prisma.vitalRecord.findMany({
        where: { patientId: user.id },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          recordedByUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { recordedAt: 'desc' },
        take: 20,
      });
    } else {
      vitals = await prisma.vitalRecord.findMany({
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          recordedByUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { recordedAt: 'desc' },
        take: 20,
      });
    }

    return NextResponse.json(vitals);
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
    const data = vitalSchema.parse(body);

    const vital = await prisma.vitalRecord.create({
      data: {
        patientId: data.patientId,
        recordedBy: user.id,
        bloodPressureSystolic: data.bloodPressureSystolic,
        bloodPressureDiastolic: data.bloodPressureDiastolic,
        heartRate: data.heartRate,
        temperature: data.temperature,
        respiratoryRate: data.respiratoryRate,
        oxygenSaturation: data.oxygenSaturation,
        weight: data.weight,
        height: data.height,
        notes: data.notes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        recordedByUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logAudit(user.id, 'CREATE', 'vital_record', vital.id);

    return NextResponse.json(vital, { status: 201 });
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
