import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['NURSE', 'DOCTOR']);
    const body = await request.json();
    const { pharmacyItemId, patientId, quantity, notes } = body;

    if (!pharmacyItemId || !patientId || !quantity) {
      return NextResponse.json({ error: 'pharmacyItemId, patientId, and quantity are required' }, { status: 400 });
    }

    const item = await prisma.pharmacyItem.findUnique({ where: { id: pharmacyItemId } });
    if (!item) {
      return NextResponse.json({ error: 'Pharmacy item not found' }, { status: 404 });
    }

    if (!item.isActive) {
      return NextResponse.json({ error: 'Pharmacy item is not active' }, { status: 400 });
    }

    if (item.stockQuantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const [log] = await prisma.$transaction([
      prisma.dispensingLog.create({
        data: {
          pharmacyItemId,
          patientId,
          dispensedBy: user.id,
          quantity,
          notes,
        },
      }),
      prisma.pharmacyItem.update({
        where: { id: pharmacyItemId },
        data: { stockQuantity: { decrement: quantity } },
      }),
    ]);

    const newStock = item.stockQuantity - quantity;
    const warning = newStock < item.reorderLevel
      ? `Low stock alert: only ${newStock} remaining (reorder level: ${item.reorderLevel})`
      : undefined;

    await logAudit(user.id, 'CREATE', 'dispensing_log', log.id, 'Medication dispensed');

    return NextResponse.json({
      log,
      newStock,
      warning,
    }, { status: 201 });
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
