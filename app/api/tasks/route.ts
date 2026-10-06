import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

async function rollUpProgress(projectId: string) {
  const tasks = await prisma.task.findMany({ where: { projectId } });
  const progress = tasks.length
    ? tasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : t.progressPercent), 0) / tasks.length
    : 0;
  await prisma.project.update({
    where: { id: projectId },
    data: { progressPercent: Math.round(progress * 10) / 10 },
  });
}

// GET: Retrieve tasks optionally filtered by projectId & client ownership
export async function GET(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    let whereClause: any = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    if (auth.isClient && auth.userId) {
      whereClause.project = { userId: auth.userId };
    }

    const tasks = await prisma.task.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST: Create a new project task assigned to a trade / phase
export async function POST(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot create tasks.' },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');

    if (!session?.user && !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, phaseName, title, assignee, dueDate, progressPercent } = body;

    if (!projectId || !phaseName || !title?.trim()) {
      return NextResponse.json(
        { error: 'Missing required task details (projectId, phaseName, title).' },
        { status: 400 }
      );
    }

    const initProgress = Number(progressPercent) || 0;

    const task = await prisma.task.create({
      data: {
        projectId,
        phaseName: phaseName.trim(),
        title: title.trim(),
        assignee: assignee?.trim() || 'Civil Contractor',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isCompleted: initProgress >= 100,
        progressPercent: initProgress,
      },
    });

    await rollUpProgress(projectId);

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('CREATE_TASK_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}