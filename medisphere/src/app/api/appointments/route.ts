import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();

    const where = user.role === 'PATIENT'
      ? { patientId: user.id }
      : user.role === 'DOCTOR'
      ? { doctorId: user.id }
      : {};

    const appointments = await prisma.appointment.findMany({
      where: {
        ...where,
        date: { gte: new Date() },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'asc' },
      take: 20,
    });

    return NextResponse.json({ appointments });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const appointment = await prisma.appointment.create({
      data: {
        patientId: user.role === 'PATIENT' ? user.id : body.patientId,
        doctorId: body.doctorId,
        date: new Date(body.date),
        startTime: new Date(body.startTime),
        type: body.type,
        notes: body.notes,
      },
    });

    await logAudit(user.id, 'CREATE', 'appointment', appointment.id, 'Appointment created');

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
