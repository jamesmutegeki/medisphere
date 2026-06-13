import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

const priorityOrder: Record<string, number> = {
  CRITICAL: 0,
  URGENT: 1,
  NORMAL: 2,
  LOW: 3,
};

export async function GET() {
  try {
    const user = await requireRole(['NURSE', 'ADMIN', 'DOCTOR']);

    const entries = await prisma.waitlistEntry.findMany({
      where: { status: 'WAITING' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    entries.sort((a, b) => {
      const pA = priorityOrder[a.priority] ?? 99;
      const pB = priorityOrder[b.priority] ?? 99;
      if (pA !== pB) return pA - pB;
      return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
    });

    const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
      if (!acc[entry.department]) {
        acc[entry.department] = [];
      }
      acc[entry.department].push(entry);
      return acc;
    }, {});

    return NextResponse.json({ departments: grouped });
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

    const queueDepth = await prisma.waitlistEntry.count({
      where: { department: body.department, status: 'WAITING' },
    });
    const estimatedWait = (queueDepth + 1) * 15;

    const entry = await prisma.waitlistEntry.create({
      data: {
        patientId: body.patientId,
        department: body.department,
        priority: body.priority || 'NORMAL',
        estimatedWait,
      },
    });

    await logAudit(user.id, 'CREATE', 'waitlist_entry', entry.id);

    return NextResponse.json({ entry }, { status: 201 });
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
