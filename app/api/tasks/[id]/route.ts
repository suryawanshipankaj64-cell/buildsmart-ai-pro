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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot update tasks.' },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');

    if (!session?.user && !authHeader && !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if ('isCompleted' in body) {
      data.isCompleted = Boolean(body.isCompleted);
      data.progressPercent = body.isCompleted ? 100 : 0;
    }
    if ('progressPercent' in body) {
      const p = Number(body.progressPercent) || 0;
      data.progressPercent = p;
      data.isCompleted = p >= 100;
    }
    if ('title' in body && body.title) data.title = String(body.title).trim();
    if ('phaseName' in body && body.phaseName) data.phaseName = String(body.phaseName).trim();
    if ('dueDate' in body && body.dueDate) data.dueDate = new Date(body.dueDate);
    if ('assignee' in body && body.assignee) data.assignee = String(body.assignee).trim();

    const updated = await prisma.task.update({
      where: { id: params.id },
      data,
    });

    await rollUpProgress(task.projectId);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH_TASK_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients cannot delete tasks.' },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');

    if (!session?.user && !authHeader && !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    await rollUpProgress(task.projectId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE_TASK_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete task' }, { status: 500 });
  }
}
