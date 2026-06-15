import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']);
    const { id } = await params;

    const result = await prisma.labResult.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (user.role === 'PATIENT' && result.patientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ result });
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['DOCTOR', 'NURSE']);
    const { id } = await params;

    const existing = await prisma.labResult.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, result } = body;

    const updateData: any = {};
    if (result !== undefined) updateData.result = result;
    if (status !== undefined) {
      if (!['NORMAL', 'ABNORMAL'].includes(status)) {
        return NextResponse.json({ error: 'Status must be NORMAL or ABNORMAL' }, { status: 400 });
      }
      updateData.status = status;
      updateData.resultDate = new Date();
    }

    const updated = await prisma.labResult.update({
      where: { id },
      data: updateData,
    });

    await logAudit(user.id, 'UPDATE', 'lab_result', updated.id, 'Lab result updated');

    return NextResponse.json({ result: updated });
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['DOCTOR', 'ADMIN']);
    const { id } = await params;

    const existing = await prisma.labResult.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.labResult.delete({ where: { id } });

    await logAudit(user.id, 'DELETE', 'lab_result', id, 'Lab result deleted');

    return NextResponse.json({ message: 'Deleted successfully' });
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
