import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireRole(['NURSE', 'ADMIN']);

    const intakes = await prisma.intake.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { checkInTime: 'asc' },
    });

    return NextResponse.json({ intakes });
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

export async function POST(request: Request) {
  try {
    const user = await requireRole(['NURSE', 'ADMIN']);
    const body = await request.json();

    if (!body.consent) {
      return NextResponse.json({ error: 'Patient consent is required' }, { status: 400 });
    }

    const intake = await prisma.intake.create({
      data: {
        patientId: body.patientId,
        chiefComplaint: body.chiefComplaint,
        bloodPressureSystolic: body.bloodPressureSystolic,
        bloodPressureDiastolic: body.bloodPressureDiastolic,
        heartRate: body.heartRate,
        temperature: body.temperature,
        allergies: body.allergies || [],
        consent: body.consent,
        checkedInBy: user.id,
      },
    });

    await logAudit(user.id, 'CREATE', 'intake', intake.id);

    return NextResponse.json({ intake }, { status: 201 });
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
