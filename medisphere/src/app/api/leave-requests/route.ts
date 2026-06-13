import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();

    const where = user.role === 'ADMIN' ? {} : { userId: user.id };

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leaveRequests });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(['DOCTOR', 'NURSE', 'ADMIN']);
    const body = await request.json();

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        type: body.type,
        reason: body.reason,
        status: 'PENDING',
      },
    });

    await logAudit(user.id, 'CREATE', 'leave_request', leaveRequest.id);

    return NextResponse.json({ leaveRequest }, { status: 201 });
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
