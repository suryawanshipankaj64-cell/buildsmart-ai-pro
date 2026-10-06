import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rates = await prisma.materialRate.findMany({ orderBy: { materialName: 'asc' } });
  return NextResponse.json(rates);
}

// Admin-only rate management (Module: Admin Rate Management).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can update material rates.' }, { status: 403 });
  }

  const { materialName, unit, unitPrice } = await req.json();
  if (!materialName || !unit || unitPrice === undefined) {
    return NextResponse.json({ error: 'Material name, unit and price are required.' }, { status: 400 });
  }

  const rate = await prisma.materialRate.upsert({
    where: { materialName },
    update: { unit, unitPrice: Number(unitPrice) },
    create: { materialName, unit, unitPrice: Number(unitPrice) },
  });

  return NextResponse.json(rate);
}
