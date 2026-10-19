import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateProjectEstimate } from '@/lib/estimation';
import { getRequestAuth } from '@/lib/userAuth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const auth = await getRequestAuth(req);

    const user = session?.user || (auth.userId ? { id: auth.userId, role: auth.role } : null);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Clients have view-only access' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const floors = Math.max(1, Number(body.floors) || 1);

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const userRole = ((session?.user as any)?.role || auth.role || '').toUpperCase();
    const userId = (session?.user as any)?.id || auth.userId;
    const isOwner = userId ? project.userId === userId : false;
    const isAdmin = userRole === 'ADMIN' || auth.isAdmin;
    const isEngineer = userRole === 'ENGINEER' || auth.isEngineer;

    if (!isOwner && !isAdmin && !isEngineer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch live admin rates from AdminSetting table
    let adminRates = await (prisma as any).adminSetting?.findFirst();

    if (!adminRates) {
      adminRates = {
        baseRatePerSqFt: 1800,
        cementBagRate: 380,
        steelKgRate: 65,
        sandCftRate: 55,
        aggregateCftRate: 42,
        brickRate: 9,
        masonDailyWage: 950,
        helperDailyWage: 550,
      };
    }

    // Compute estimate based on area, floors, and admin rates
    const estimateData = calculateProjectEstimate(
      project.builtUpAreaSqFt || 1000,
      floors,
      adminRates
    );

    // CRITICAL: equipmentItems is computed for UI/PDF display, not a column in Prisma Estimate model!
    const { equipmentItems, ...estimateDbFields } = estimateData;

    // Upsert the estimate for this project
    const estimate = await prisma.estimate.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        ...estimateDbFields,
      },
      update: {
        ...estimateDbFields,
      },
    });

    return NextResponse.json({
      ...estimate,
      equipmentItems,
    });
  } catch (error: any) {
    console.error('ESTIMATE_API_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to compute estimate' },
      { status: 500 }
    );
  }
}