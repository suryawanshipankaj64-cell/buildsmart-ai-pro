import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let setting = await prisma.adminSetting.findFirst();
    if (!setting) {
      setting = await prisma.adminSetting.create({
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

    const standardRate = Number(setting.baseRatePerSqFt) || Number(setting.standardRatePerSqFt) || 1800;

    return NextResponse.json({
      ...setting,
      baseRatePerSqFt: standardRate,
      standardRatePerSqFt: standardRate,
      premiumRatePerSqFt: Number(setting.premiumRatePerSqFt) || 2200,
      luxuryRatePerSqFt: Number(setting.luxuryRatePerSqFt) || 3100,
      cementBagRate: Number(setting.cementBagRate) || 380,
      steelKgRate: Number(setting.steelKgRate) || 65,
      sandCftRate: Number(setting.sandCftRate) || 55,
      aggregateCftRate: Number(setting.aggregateCftRate) || 42,
      brickRate: Number(setting.brickRate) || 9,
      masonDailyWage: Number(setting.masonDailyWage) || 950,
      helperDailyWage: Number(setting.helperDailyWage) || 550,
    });
  } catch (error: any) {
    console.error('GET_RATES_ERROR:', error);
    return NextResponse.json({
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
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const standardRate = Number(body.baseRatePerSqFt ?? body.standardRatePerSqFt) || 1800;
    const premiumRate = Number(body.premiumRatePerSqFt) || 2200;
    const luxuryRate = Number(body.luxuryRatePerSqFt) || 3100;
    const cementBagRate = Number(body.cementBagRate) || 380;
    const steelKgRate = Number(body.steelKgRate) || 65;
    const sandCftRate = Number(body.sandCftRate) || 55;
    const aggregateCftRate = Number(body.aggregateCftRate) || 42;
    const brickRate = Number(body.brickRate) || 9;
    const masonDailyWage = Number(body.masonDailyWage) || 950;
    const helperDailyWage = Number(body.helperDailyWage) || 550;

    let existing = await prisma.adminSetting.findFirst();

    const data = {
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
    if (existing) {
      updated = await prisma.adminSetting.update({
        where: { id: existing.id },
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
    console.error('POST_RATES_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update rates' }, { status: 500 });
  }
}