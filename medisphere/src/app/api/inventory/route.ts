import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, logAudit } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(['ADMIN', 'NURSE']);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { itemName: 'asc' },
    });

    const lowStockItems = items.filter(item => item.quantity <= item.reorderLevel);

    return NextResponse.json({ items, lowStockCount: lowStockItems.length });
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

    const item = await prisma.inventoryItem.create({
      data: {
        itemName: body.itemName,
        category: body.category,
        quantity: body.quantity,
        unit: body.unit,
        reorderLevel: body.reorderLevel,
        unitPrice: body.unitPrice,
        supplier: body.supplier,
        location: body.location,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    });

    await logAudit(user.id, 'CREATE', 'inventory_item', item.id);

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
