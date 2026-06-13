import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';
import { invoiceSchema } from '@/lib/validations';
import { generateInvoiceNumber } from '@/lib/utils';

export async function GET() {
  try {
    const user = await requireAuth();

    const where = user.role === 'PATIENT' ? { patientId: user.id } : {};

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(['BILLING', 'ADMIN']);
    const body = await request.json();

    const data = invoiceSchema.parse(body);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        patientId: data.patientId,
        issuedBy: user.id,
        consultationFee: data.consultationFee,
        labFees: data.labFees,
        medicationFees: data.medicationFees,
        wardCharges: data.wardCharges,
        otherCharges: data.otherCharges,
        discount: data.discount,
        tax: data.tax,
        totalAmount: data.totalAmount,
        status: 'PENDING',
        notes: data.notes,
      },
    });

    await logAudit(user.id, 'CREATE', 'invoice', invoice.id, 'Invoice created');

    return NextResponse.json({ invoice }, { status: 201 });
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
