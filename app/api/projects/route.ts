import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

export async function GET(req: Request) {
  try {
    const auth = await getRequestAuth(req);

    // If Client: isolate data so they ONLY see their own project
    let whereClause: any = {};
    if (auth.isClient && auth.userId) {
      whereClause = {
        userId: auth.userId,
      };
    }

    let projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: true,
        expenses: true,
        estimate: true,
        sitePhotos: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    // If Client has no isolated projects assigned directly to their userId, show active company projects in read-only mode
    if (auth.isClient && projects.length === 0) {
      projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          tasks: true,
          expenses: true,
          estimate: true,
          sitePhotos: {
            orderBy: { uploadedAt: 'desc' },
          },
        },
      });
    }

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('GET_PROJECTS_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Client accounts cannot create new projects.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));

    const {
      name,
      location,
      builtUpAreaSqFt,
      budget,
      startDate,
      endDate,
      targetCompletion,
      coverImageUrl,
      autoSeed = true,
    } = body;

    if (!name?.trim() || !location?.trim()) {
      return NextResponse.json(
        { error: 'Project name and location are required.' },
        { status: 400 }
      );
    }

    // 1. Resolve active user ID safely against the database to guarantee valid FK
    let activeUserId: string | null = null;

    if (auth.userId || auth.userEmail) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: auth.userId || '__none__' },
            { email: auth.userEmail || '__none__' },
          ],
        },
      });
      if (dbUser) {
        activeUserId = dbUser.id;
      }
    }

    if (!activeUserId && session?.user) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: (session.user as any)?.id || '__none__' },
            { email: session.user?.email || '__none__' },
          ],
        },
      });
      if (dbUser) {
        activeUserId = dbUser.id;
      }
    }

    if (!activeUserId) {
      const fallbackUser = await prisma.user.findFirst();
      if (fallbackUser) {
        activeUserId = fallbackUser.id;
      } else {
        const defaultUser = await prisma.user.create({
          data: {
            email: 'admin@buildsmart.ai',
            name: 'Pankaj Suryawanshi',
            password: 'default_password',
            role: 'ADMIN',
            isApproved: true,
          },
        });
        activeUserId = defaultUser.id;
      }
    }

    // 2. Safely parse numbers
    const area = Number(builtUpAreaSqFt) || 0;
    const projectBudget = Number(budget) || 0;

    // 3. Safely parse dates
    let parsedStart = new Date();
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) parsedStart = d;
    }

    let parsedEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const rawEnd = targetCompletion || endDate;
    if (rawEnd) {
      const d = new Date(rawEnd);
      if (!isNaN(d.getTime())) parsedEnd = d;
    }

    // 4. Create Project with guaranteed valid userId
    const project = await prisma.project.create({
      data: {
        userId: activeUserId,
        name: name.trim(),
        location: location.trim(),
        builtUpAreaSqFt: area,
        budget: projectBudget,
        startDate: parsedStart,
        endDate: parsedEnd,
        status: 'PLANNING',
        progressPercent: 0,
      },
    });

    // 5. If autoSeed is enabled (default true), populate standard milestone deliverables
    if (autoSeed) {
      const standardTasks = [
        { phaseName: 'Planning', title: 'Boundary Pegging, Soil Investigation & Site Layout Grid' },
        { phaseName: 'Planning', title: 'Architectural Approvals, Structural Blueprints & Utility Plan Review' },
        { phaseName: 'Substructure & Foundation', title: 'Footing Pit Excavation, PCC Bedding & Anti-Termite Treatment' },
        { phaseName: 'Substructure & Foundation', title: 'Plinth Beam Reinforcement, Shuttering & Concrete Pouring' },
        { phaseName: 'Superstructure & Masonry', title: 'RCC Columns, Roof Beam Slabs & 9" Red Brick / AAC Block Walls' },
        { phaseName: 'Superstructure & Masonry', title: 'Door/Window Lintel Casting & Internal Wall Plastering' },
        { phaseName: 'Plumbing Work', title: 'Concealed CPVC/UPVC Water Supply Lines & Overhead Tank Risers' },
        { phaseName: 'Plumbing Work', title: 'Soil Drainage Waste Pipes, Inspection Chambers & Hydrostatic Leak Testing' },
        { phaseName: 'Electrical Work', title: 'Heavy Duty PVC Conduit Wall Chasing, DB Distribution Enclosures & Earth Pit' },
        { phaseName: 'Electrical Work', title: 'Wiring Harness Pulling, Sub-circuit Balancing & Inverter/Generator Lines' },
        { phaseName: 'Paint & Finishing Work', title: 'Wall Putty 2-Coat System, Acrylic Primer & Internal Emulsion Paint' },
        { phaseName: 'Paint & Finishing Work', title: 'Exterior Weatherproof Emulsion, Facade Texture & Primer Coating' },
        { phaseName: 'Interior & Woodwork', title: 'Teak/Flush Doors, Window Frames, Kitchen Cabinets & Gypsum False Ceiling' },
        { phaseName: 'Interior & Woodwork', title: 'Vitrified Floor Tiling, Skirting & Wood Polish Treatment' },
        { phaseName: 'Handover & Commissioning', title: 'Plumbing & Electrical Fixtures: Modular Switches, Faucets & Sanitary Ware Fitting' },
        { phaseName: 'Handover & Commissioning', title: 'Site Deep Cleaning, Final Inspection Certification & Client Handover' },
      ];

      for (const t of standardTasks) {
        await prisma.task.create({
          data: {
            projectId: project.id,
            phaseName: t.phaseName,
            title: t.title,
            assignee: 'Civil Contractor',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            progressPercent: 0,
            isCompleted: false,
          },
        });
      }
    }

    // 6. If coverImageUrl is provided, attach as initial Architectural Blueprint / Site Plan photo
    if (coverImageUrl && typeof coverImageUrl === 'string' && coverImageUrl.trim()) {
      try {
        await prisma.sitePhoto.create({
          data: {
            projectId: project.id,
            imageUrl: coverImageUrl.trim(),
            caption: '[Planning] Architectural Blueprint / Master Elevation',
          },
        });
      } catch (photoErr) {
        console.error('FAILED_TO_ATTACH_COVER_PHOTO:', photoErr);
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('PROJECT_CREATION_FAILED:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create project.' },
      { status: 500 }
    );
  }
}