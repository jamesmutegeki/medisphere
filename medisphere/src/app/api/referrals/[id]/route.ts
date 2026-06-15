import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['DOCTOR', 'ADMIN']);
    const { id } = await params;

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        referringDoctor: { select: { id: true, firstName: true, lastName: true } },
        referredDoctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!referral) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (user.role === 'DOCTOR' &&
        referral.referringDoctorId !== user.id &&
        referral.referredDoctorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ referral });
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['DOCTOR']);
    const { id } = await params;

    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (referral.referredDoctorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be ACCEPTED or DECLINED' }, { status: 400 });
    }

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status,
        responseDate: new Date(),
        referredDoctorId: user.id,
      },
    });

    await logAudit(user.id, 'UPDATE', 'referral', updated.id, `Referral ${status.toLowerCase()}`);

    return NextResponse.json({ referral: updated });
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
