import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';
import { pharmacyItemSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await requireRole(['DOCTOR', 'NURSE', 'ADMIN', 'PATIENT']);

    const items = await prisma.pharmacyItem.findMany({
      where: { isActive: true },
      orderBy: { medicationName: 'asc' },
    });

    const reorderAlerts = items.filter((item) => item.stockQuantity < item.reorderLevel);

    return NextResponse.json({ items, reorderAlerts });
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
    const user = await requireRole(['ADMIN', 'NURSE']);
    const body = await request.json();
    const data = pharmacyItemSchema.parse(body);

    const item = await prisma.pharmacyItem.create({
      data: {
        medicationName: data.medicationName,
        genericName: data.genericName,
        category: data.category,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        reorderLevel: data.reorderLevel,
        unitPrice: data.unitPrice,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        supplier: data.supplier,
      },
    });

    await logAudit(user.id, 'CREATE', 'pharmacy_item', item.id, 'Pharmacy item added');

    return NextResponse.json({ item }, { status: 201 });
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
