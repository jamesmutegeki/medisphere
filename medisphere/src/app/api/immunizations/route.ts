import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();

    const where = user.role === 'PATIENT' ? { patientId: user.id } : {};

    const immunizations = await prisma.immunization.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { administrationDate: 'desc' },
    });

    return NextResponse.json({ immunizations });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(['DOCTOR', 'NURSE']);
    const body = await request.json();

    const immunization = await prisma.immunization.create({
      data: {
        patientId: body.patientId,
        administeredBy: user.id,
        vaccineName: body.vaccineName,
        doseNumber: body.doseNumber,
        administrationDate: new Date(body.administrationDate),
        nextDoseDate: body.nextDoseDate ? new Date(body.nextDoseDate) : null,
        batchNumber: body.batchNumber,
        site: body.site,
        notes: body.notes,
      },
    });

    await logAudit(user.id, 'CREATE', 'immunization', immunization.id);

    return NextResponse.json({ immunization }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
