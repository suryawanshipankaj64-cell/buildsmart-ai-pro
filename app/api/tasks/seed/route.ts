import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STANDARD_TRADE_TASKS = [
  // 1. Planning Phase
  {
    phaseName: 'Planning',
    title: 'Boundary Pegging, Soil Investigation & Site Layout Grid',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Planning',
    title: 'Architectural Approvals, Structural Blueprints & Utility Plan Review',
    assignee: 'Civil Contractor',
  },

  // 2. Substructure & Foundation Phase
  {
    phaseName: 'Substructure & Foundation',
    title: 'Footing Pit Excavation, PCC Bedding & Anti-Termite Treatment',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Substructure & Foundation',
    title: 'Plinth Beam Reinforcement, Shuttering & Concrete Pouring',
    assignee: 'Civil Contractor',
  },

  // 3. Superstructure & Masonry Phase
  {
    phaseName: 'Superstructure & Masonry',
    title: 'RCC Columns, Roof Beam Slabs & 9" Red Brick / AAC Block Walls',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Superstructure & Masonry',
    title: 'Door/Window Lintel Casting & Internal Wall Plastering',
    assignee: 'Civil Contractor',
  },

  // 4. Plumbing Work Phase
  {
    phaseName: 'Plumbing Work',
    title: 'Concealed CPVC/UPVC Water Supply Lines & Overhead Tank Risers',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Plumbing Work',
    title: 'Soil Drainage Waste Pipes, Inspection Chambers & Hydrostatic Leak Testing',
    assignee: 'Civil Contractor',
  },

  // 5. Electrical Work Phase
  {
    phaseName: 'Electrical Work',
    title: 'Heavy Duty PVC Conduit Wall Chasing, DB Distribution Enclosures & Earth Pit',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Electrical Work',
    title: 'Wiring Harness Pulling, Sub-circuit Balancing & Inverter/Generator Lines',
    assignee: 'Civil Contractor',
  },

  // 6. Paint & Finishing Work Phase
  {
    phaseName: 'Paint & Finishing Work',
    title: 'Wall Putty 2-Coat System, Acrylic Primer & Internal Emulsion Paint',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Paint & Finishing Work',
    title: 'Exterior Weatherproof Emulsion, Facade Texture & Primer Coating',
    assignee: 'Civil Contractor',
  },

  // 7. Interior & Woodwork Phase
  {
    phaseName: 'Interior & Woodwork',
    title: 'Teak/Flush Doors, Window Frames, Kitchen Cabinets & Gypsum False Ceiling',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Interior & Woodwork',
    title: 'Vitrified Floor Tiling, Skirting & Wood Polish Treatment',
    assignee: 'Civil Contractor',
  },

  // 8. Handover & Commissioning Phase
  {
    phaseName: 'Handover & Commissioning',
    title: 'Plumbing & Electrical Fixtures: Modular Switches, Faucets & Sanitary Ware Fitting',
    assignee: 'Civil Contractor',
  },
  {
    phaseName: 'Handover & Commissioning',
    title: 'Site Deep Cleaning, Final Inspection Certification & Client Handover',
    assignee: 'Civil Contractor',
  },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, action = 'seed' } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (action === 'clear') {
      // Clear/Delete standard auto-seeded tasks
      const standardPhaseNames = Array.from(new Set(STANDARD_TRADE_TASKS.map((t) => t.phaseName)));
      const standardTitles = STANDARD_TRADE_TASKS.map((t) => t.title.trim().toLowerCase());

      const tasksToDelete = project.tasks.filter((t) => 
        standardPhaseNames.includes(t.phaseName) ||
        standardTitles.includes(t.title.trim().toLowerCase())
      );

      let deletedCount = 0;
      if (tasksToDelete.length > 0) {
        const res = await prisma.task.deleteMany({
          where: {
            id: { in: tasksToDelete.map((t) => t.id) },
          },
        });
        deletedCount = res.count;
      }

      // Recompute rollup for remaining tasks
      const remainingTasks = await prisma.task.findMany({ where: { projectId } });
      const avg = remainingTasks.length > 0
        ? remainingTasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : t.progressPercent), 0) / remainingTasks.length
        : 0;

      await prisma.project.update({
        where: { id: projectId },
        data: { progressPercent: Math.round(avg * 10) / 10 },
      });

      return NextResponse.json({
        success: true,
        action: 'clear',
        message: `Removed ${deletedCount} standard phase tasks.`,
        deletedCount,
      });
    }

    // Default 'seed' action: Consolidate any existing tasks under Civil Contractor
    await prisma.task.updateMany({
      where: {
        projectId,
        OR: [
          { assignee: { not: 'Civil Contractor' } },
          { assignee: null }
        ]
      },
      data: { assignee: 'Civil Contractor' }
    });

    // Migrate legacy MEP phase tasks if any
    await prisma.task.updateMany({
      where: { projectId, phaseName: 'MEP & Rough-ins' },
      data: { phaseName: 'Plumbing Work' }
    });

    const refreshedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    });

    const existingTasks = refreshedProject?.tasks || [];
    const createdTasks = [];

    for (const taskTemplate of STANDARD_TRADE_TASKS) {
      const alreadyExists = existingTasks.some(
        (t) =>
          t.phaseName.trim().toLowerCase() === taskTemplate.phaseName.trim().toLowerCase() &&
          t.title.trim().toLowerCase() === taskTemplate.title.trim().toLowerCase()
      );

      if (!alreadyExists) {
        const created = await prisma.task.create({
          data: {
            projectId,
            phaseName: taskTemplate.phaseName,
            title: taskTemplate.title,
            assignee: 'Civil Contractor',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            progressPercent: 0,
            isCompleted: false,
          },
        });
        createdTasks.push(created);
      }
    }

    // Recompute rollup
    const allTasks = await prisma.task.findMany({ where: { projectId } });
    if (allTasks.length > 0) {
      const avg =
        allTasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : t.progressPercent), 0) /
        allTasks.length;
      await prisma.project.update({
        where: { id: projectId },
        data: { progressPercent: Math.round(avg * 10) / 10 },
      });
    }

    return NextResponse.json({
      success: true,
      action: 'seed',
      createdCount: createdTasks.length,
      message: `Created ${createdTasks.length} standard trade tasks.`,
      tasks: createdTasks,
    });
  } catch (error: any) {
    console.error('SEED_TASKS_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to seed trade tasks' },
      { status: 500 }
    );
  }
}
