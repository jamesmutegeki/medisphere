import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId');

    const where = wardId ? { wardId } : {};

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: { select: { id: true, name: true } },
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ wardId: 'asc' }, { bedLabel: 'asc' }],
    });

    return NextResponse.json({ beds });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(['ADMIN', 'NURSE']);
    const body = await request.json();

    const bed = await prisma.bed.findUnique({ where: { id: body.bedId } });
    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    if (bed.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Bed is not available' }, { status: 409 });
    }

    const updated = await prisma.bed.update({
      where: { id: body.bedId },
      data: {
        status: 'OCCUPIED',
        patientId: body.patientId,
        assignedAt: new Date(),
      },
    });

    await logAudit(user.id, 'UPDATE', 'bed', updated.id, `Bed assigned to patient ${body.patientId}`);

    return NextResponse.json({ bed: updated });
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
