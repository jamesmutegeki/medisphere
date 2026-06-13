import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';
import { referralSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    const where = user.role === 'DOCTOR'
      ? {
          OR: [
            { referringDoctorId: user.id },
            { referredDoctorId: user.id },
          ],
        }
      : {};

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        referringDoctor: { select: { id: true, firstName: true, lastName: true } },
        referredDoctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ referrals });
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
    const user = await requireRole(['DOCTOR']);
    const body = await request.json();
    const data = referralSchema.parse(body);

    const referral = await prisma.referral.create({
      data: {
        patientId: data.patientId,
        referringDoctorId: user.id,
        department: data.department,
        priority: data.priority,
        reason: data.reason,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    await logAudit(user.id, 'CREATE', 'referral', referral.id, 'Referral created');

    return NextResponse.json({ referral }, { status: 201 });
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
