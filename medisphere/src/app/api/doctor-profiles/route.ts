import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    const profiles = await prisma.doctorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { user: { lastName: 'asc' } },
    });

    const doctors = profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: `${p.user.firstName} ${p.user.lastName}`,
      specialization: p.specialization,
      department: p.department,
      consultationFee: p.consultationFee,
      isAvailable: p.isAvailable,
    }));

    return NextResponse.json({ doctors });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    let targetUserId = user.id;
    if (user.role === 'ADMIN' && body.userId) {
      targetUserId = body.userId;
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && profile.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data: any = {};
    if (body.specialization !== undefined) data.specialization = body.specialization;
    if (body.department !== undefined) data.department = body.department;
    if (body.consultationFee !== undefined) data.consultationFee = body.consultationFee;
    if (body.isAvailable !== undefined) data.isAvailable = body.isAvailable;
    if (body.bio !== undefined) data.bio = body.bio;

    const updated = await prisma.doctorProfile.update({
      where: { userId: targetUserId },
      data,
    });

    await logAudit(user.id, 'UPDATE', 'doctor_profile', updated.id, JSON.stringify(data));

    return NextResponse.json({ profile: updated });
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
