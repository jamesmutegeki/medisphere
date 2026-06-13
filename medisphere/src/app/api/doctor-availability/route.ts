import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(['DOCTOR', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json({ error: 'doctorId and date are required' }, { status: 400 });
    }

    const slots = await prisma.availability.findMany({
      where: {
        doctorId,
        date: new Date(date),
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ slots });
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

    const date = new Date(body.date);

    await prisma.availability.deleteMany({
      where: { doctorId: user.id, date },
    });

    const slotsData = body.slots.map(
      (slot: { startTime: string; endTime: string; isAvailable?: boolean }) => ({
        doctorId: user.id,
        date,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        isAvailable: slot.isAvailable ?? true,
      })
    );

    const result = await prisma.availability.createMany({
      data: slotsData,
    });

    await logAudit(
      user.id,
      'CREATE',
      'availability',
      `${user.id}-${date.toISOString().split('T')[0]}`,
      `Set ${body.slots.length} slots`
    );

    return NextResponse.json({ count: result.count }, { status: 201 });
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
