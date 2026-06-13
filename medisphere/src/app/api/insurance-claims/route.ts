import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';
import { insuranceClaimSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireAuth();

    const where = user.role === 'PATIENT' ? { patientId: user.id } : {};

    const claims = await prisma.insuranceClaim.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ claims });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(['BILLING']);
    const body = await request.json();

    const data = insuranceClaimSchema.parse(body);

    const claim = await prisma.insuranceClaim.create({
      data: {
        patientId: data.patientId,
        providerName: data.providerName,
        policyNumber: data.policyNumber,
        claimAmount: data.claimAmount,
        notes: data.notes,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await logAudit(user.id, 'CREATE', 'insurance_claim', claim.id, 'Insurance claim created');

    return NextResponse.json({ claim }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
