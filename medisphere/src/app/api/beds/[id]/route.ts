import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    const bed = await prisma.bed.findUnique({
      where: { id: params.id },
      include: {
        ward: { select: { id: true, name: true, type: true, floor: true, wing: true } },
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    return NextResponse.json({ bed });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(['ADMIN', 'NURSE']);
    const body = await request.json();

    const existing = await prisma.bed.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    const updateData: any = { status: body.status };

    if (body.status === 'AVAILABLE') {
      updateData.patientId = null;
      updateData.assignedAt = null;
    }

    if (body.status === 'MAINTENANCE' && body.status !== existing.status) {
      updateData.patientId = null;
      updateData.assignedAt = null;
    }

    const bed = await prisma.bed.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAudit(user.id, 'UPDATE', 'bed', bed.id, `Bed status updated to ${bed.status}`);

    return NextResponse.json({ bed });
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
