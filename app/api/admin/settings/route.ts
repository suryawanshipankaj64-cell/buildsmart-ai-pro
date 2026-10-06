import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let row = await prisma.adminSetting.findFirst();
    if (!row) {
      row = await prisma.adminSetting.create({
        data: {
          isSiteLocked: false,
          baseRatePerSqFt: 1800,
          standardRatePerSqFt: 1800,
          premiumRatePerSqFt: 2200,
          luxuryRatePerSqFt: 3100,
          cementBagRate: 380,
          steelKgRate: 65,
          sandCftRate: 55,
          aggregateCftRate: 42,
          brickRate: 9,
          masonDailyWage: 950,
          helperDailyWage: 550,
        },
      });
    }

    const standardRate = Number(row.baseRatePerSqFt) || Number(row.standardRatePerSqFt) || 1800;

    return NextResponse.json({
      ...row,
      baseRatePerSqFt: standardRate,
      standardRatePerSqFt: standardRate,
      premiumRatePerSqFt: Number(row.premiumRatePerSqFt) || 2200,
      luxuryRatePerSqFt: Number(row.luxuryRatePerSqFt) || 3100,
    });
  } catch (error: any) {
    console.error('ADMIN_SETTINGS_GET_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access only.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    let row = await prisma.adminSetting.findFirst();

    const standardRate = Number(body.standardRatePerSqFt ?? body.baseRatePerSqFt) || (row ? Number(row.baseRatePerSqFt) : 1800);
    const premiumRate = Number(body.premiumRatePerSqFt) || (row ? Number(row.premiumRatePerSqFt) : 2200);
    const luxuryRate = Number(body.luxuryRatePerSqFt) || (row ? Number(row.luxuryRatePerSqFt) : 3100);
    const cementBagRate = body.cementBagRate !== undefined ? Number(body.cementBagRate) : (row ? Number(row.cementBagRate) : 380);
    const steelKgRate = body.steelKgRate !== undefined ? Number(body.steelKgRate) : (row ? Number(row.steelKgRate) : 65);
    const sandCftRate = body.sandCftRate !== undefined ? Number(body.sandCftRate) : (row ? Number(row.sandCftRate) : 55);
    const aggregateCftRate = body.aggregateCftRate !== undefined ? Number(body.aggregateCftRate) : (row ? Number(row.aggregateCftRate) : 42);
    const brickRate = body.brickRate !== undefined ? Number(body.brickRate) : (row ? Number(row.brickRate) : 9);
    const masonDailyWage = body.masonDailyWage !== undefined ? Number(body.masonDailyWage) : (row ? Number(row.masonDailyWage) : 950);
    const helperDailyWage = body.helperDailyWage !== undefined ? Number(body.helperDailyWage) : (row ? Number(row.helperDailyWage) : 550);
    const isSiteLocked = typeof body.isSiteLocked === 'boolean' ? body.isSiteLocked : (row ? Boolean(row.isSiteLocked) : false);

    const data = {
      isSiteLocked,
      baseRatePerSqFt: standardRate,
      standardRatePerSqFt: standardRate,
      premiumRatePerSqFt: premiumRate,
      luxuryRatePerSqFt: luxuryRate,
      cementBagRate,
      steelKgRate,
      sandCftRate,
      aggregateCftRate,
      brickRate,
      masonDailyWage,
      helperDailyWage,
    };

    let updated;
    if (row) {
      updated = await prisma.adminSetting.update({
        where: { id: row.id },
        data,
      });
    } else {
      updated = await prisma.adminSetting.create({
        data,
      });
    }

    return NextResponse.json({
      ...updated,
      baseRatePerSqFt: standardRate,
      standardRatePerSqFt: standardRate,
    });
  } catch (error: any) {
    console.error('ADMIN_SETTINGS_PATCH_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}