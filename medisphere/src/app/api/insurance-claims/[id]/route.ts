import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        processor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (user.role === 'PATIENT' && claim.patientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ claim });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(['BILLING']);
    const body = await request.json();

    const existing = await prisma.insuranceClaim.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const updateData: any = {
      status: body.status,
      processedBy: body.status === 'APPROVED' || body.status === 'DENIED' ? user.id : undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
    };

    if (body.status === 'APPROVED') {
      updateData.decisionDate = new Date();
      updateData.approvedAmount = body.approvedAmount;
    }

    const claim = await prisma.insuranceClaim.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAudit(user.id, 'UPDATE', 'insurance_claim', claim.id, `Claim status updated to ${claim.status}`);

    return NextResponse.json({ claim });
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(['BILLING', 'ADMIN']);

    const existing = await prisma.insuranceClaim.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    await prisma.insuranceClaim.delete({ where: { id: params.id } });

    await logAudit(user.id, 'DELETE', 'insurance_claim', params.id, 'Insurance claim deleted');

    return NextResponse.json({ success: true });
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
