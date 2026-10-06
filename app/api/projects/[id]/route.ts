import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequestAuth(req);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        estimate: true,
        expenses: { orderBy: { date: 'desc' } },
        tasks: { orderBy: { dueDate: 'asc' } },
        sitePhotos: { orderBy: { uploadedAt: 'desc' } },
        changeLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Client isolation check: Client can ONLY access their own project
    if (auth.isClient && auth.userId && project.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own assigned project.' },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('GET_PROJECT_ID_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user && !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
    const allowed = [
      'name',
      'location',
      'builtUpAreaSqFt',
      'budget',
      'startDate',
      'endDate',
      'status',
      'progressPercent',
      'latitude',
      'longitude',
    ];

    const data: Record<string, unknown> = {};
    const logs: { field: string; oldValue: string; newValue: string }[] = [];

    for (const key of allowed) {
      if (key in body) {
        const oldValue = (project as any)[key];
        let newValue = body[key];

        if (key === 'startDate' || key === 'endDate') {
          newValue = new Date(newValue);
        } else if (key === 'builtUpAreaSqFt' || key === 'budget' || key === 'progressPercent') {
          newValue = Number(newValue);
        }

        data[key] = newValue;

        if (String(oldValue) !== String(newValue)) {
          logs.push({
            field: key,
            oldValue: String(oldValue ?? ''),
            newValue: String(newValue ?? ''),
          });
        }
      }
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data,
    });

    if (logs.length > 0) {
      await prisma.changeLog.createMany({
        data: logs.map((l) => ({
          projectId: params.id,
          field: l.field,
          oldValue: l.oldValue,
          newValue: l.newValue,
          changedBy: session?.user?.email || auth.userEmail || 'System Admin',
        })),
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH_PROJECT_ID_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients cannot delete projects.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user && !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Cascades delete expenses, tasks, estimates, changeLogs, sitePhotos via Prisma relation
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE_PROJECT_ID_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Delete failed' },
      { status: 500 }
    );
  }
}