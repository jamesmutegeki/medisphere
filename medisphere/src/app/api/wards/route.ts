import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireRole(['ADMIN', 'NURSE', 'DOCTOR']);

    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      include: {
        beds: {
          select: { status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = wards.map((ward) => {
      const totalBeds = ward.beds.length;
      const availableBeds = ward.beds.filter((b) => b.status === 'AVAILABLE').length;
      const occupiedBeds = ward.beds.filter((b) => b.status === 'OCCUPIED').length;
      const reservedBeds = ward.beds.filter((b) => b.status === 'RESERVED').length;
      const maintenanceBeds = ward.beds.filter((b) => b.status === 'MAINTENANCE').length;

      return {
        id: ward.id,
        name: ward.name,
        type: ward.type,
        floor: ward.floor,
        wing: ward.wing,
        totalBeds,
        availableBeds,
        occupiedBeds,
        reservedBeds,
        maintenanceBeds,
      };
    });

    return NextResponse.json({ wards: result });
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
