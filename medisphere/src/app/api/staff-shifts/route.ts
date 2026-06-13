import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';
import { staffShiftSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const user = await requireRole(['ADMIN']);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    const where: any = {};
    if (userId) where.userId = userId;
    if (date) where.date = new Date(date);

    const shifts = await prisma.staffShift.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    return NextResponse.json({ shifts });
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
    const user = await requireRole(['ADMIN']);
    const body = await request.json();
    const data = staffShiftSchema.parse(body);

    const shift = await prisma.staffShift.create({
      data: {
        userId: data.userId,
        date: new Date(data.date),
        startTime: new Date(`${data.date}T${data.startTime}`),
        endTime: new Date(`${data.date}T${data.endTime}`),
        role: user.role,
        notes: data.notes,
      },
    });

    await logAudit(user.id, 'CREATE', 'staff_shift', shift.id, 'Staff shift created');

    return NextResponse.json({ shift }, { status: 201 });
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
