import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';
import { labResultSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireRole(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']);

    const where = user.role === 'PATIENT' ? { patientId: user.id } : {};

    const results = await prisma.labResult.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ results });
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
    const user = await requireRole(['DOCTOR', 'NURSE']);
    const body = await request.json();
    const data = labResultSchema.parse(body);

    const result = await prisma.labResult.create({
      data: {
        patientId: data.patientId,
        doctorId: user.id,
        testName: data.testName,
        testCategory: data.testCategory,
        result: data.result,
        normalRange: data.normalRange,
        unit: data.unit,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    await logAudit(user.id, 'CREATE', 'lab_result', result.id, 'Lab result created');

    return NextResponse.json({ result }, { status: 201 });
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
