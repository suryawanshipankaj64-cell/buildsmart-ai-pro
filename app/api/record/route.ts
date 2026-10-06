import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, projectId, payload } = body;

    if (!actionType || !projectId) {
      return NextResponse.json(
        { error: 'actionType and projectId are required.' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    let result: any = { success: true, actionType, timestamp: new Date().toISOString() };

    switch (actionType) {
      case 'sitelog': {
        const { note, weather, workersCount, supervisorName } = payload || {};
        const changelog = await prisma.changeLog.create({
          data: {
            projectId,
            field: 'DAILY_SITE_LOG',
            oldValue: weather ? `Weather: ${weather}` : null,
            newValue: `Workers: ${workersCount || 'N/A'} | Note: ${note || 'Daily check-in'}`,
            changedBy: supervisorName || 'Site Engineer (Mobile)',
          },
        });

        // Also add notification
        if (project.userId) {
          await prisma.notification.create({
            data: {
              userId: project.userId,
              projectId,
              type: 'SITE_LOG_RECORDED',
              message: `Daily Site Log recorded by ${supervisorName || 'Site Engineer'}: ${note || 'Log completed'}`,
            },
          });
        }
        result.record = changelog;
        break;
      }

      case 'voice_note': {
        const { audioDuration, transcription, capturedBy } = payload || {};
        const changelog = await prisma.changeLog.create({
          data: {
            projectId,
            field: 'VOICE_MEMO',
            oldValue: `Duration: ${audioDuration || '0'}s`,
            newValue: transcription || 'Voice note recorded on site.',
            changedBy: capturedBy || 'Site Engineer (Mobile)',
          },
        });
        result.record = changelog;
        break;
      }

      case 'phase_update': {
        const { phaseName, progressPercent, notes, assignee } = payload || {};
        const newProgress = Math.min(100, Math.max(0, Number(progressPercent) || 0));

        // 1. Check if tasks exist for this phase (case-insensitive search per project)
        const allProjectTasks = await prisma.task.findMany({
          where: { projectId },
        });

        const existingPhaseTasks = allProjectTasks.filter(
          (t) => t.phaseName.trim().toLowerCase() === (phaseName || '').trim().toLowerCase()
        );

        if (existingPhaseTasks.length > 0) {
          const taskIds = existingPhaseTasks.map((t) => t.id);
          await prisma.task.updateMany({
            where: { id: { in: taskIds } },
            data: {
              progressPercent: newProgress,
              isCompleted: newProgress >= 100,
              assignee: 'Civil Contractor',
            },
          });
        } else {
          // If no tasks exist in this phase yet for this project, auto-create a milestone task under Civil Contractor
          await prisma.task.create({
            data: {
              projectId,
              phaseName: phaseName?.trim() || 'Planning',
              title: `${phaseName?.trim() || 'Phase'} · Civil Contractor Deliverables`,
              assignee: 'Civil Contractor',
              dueDate: project.endDate || new Date(),
              progressPercent: newProgress,
              isCompleted: newProgress >= 100,
            },
          });
        }

        // 2. Recompute project progress roll-up strictly for this project
        const allTasks = await prisma.task.findMany({ where: { projectId } });
        if (allTasks.length > 0) {
          const avg = allTasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : t.progressPercent), 0) / allTasks.length;
          await prisma.project.update({
            where: { id: projectId },
            data: { progressPercent: Math.round(avg * 10) / 10 },
          });
        } else {
          await prisma.project.update({
            where: { id: projectId },
            data: { progressPercent: newProgress },
          });
        }

        const changelog = await prisma.changeLog.create({
          data: {
            projectId,
            field: `PHASE_UPDATE:${phaseName || 'GENERAL'}`,
            oldValue: `${project.progressPercent}%`,
            newValue: `${newProgress}% — ${notes || 'Updated via mobile'}`,
            changedBy: 'Site Engineer (Mobile)',
          },
        });
        result.record = changelog;
        break;
      }

      case 'photo': {
        const { imageUrl, caption, latitude, longitude } = payload || {};
        let finalImageUrl = (imageUrl || '').trim();
        if (!finalImageUrl || finalImageUrl.startsWith('file://') || finalImageUrl.startsWith('content://')) {
          const cap = (caption || '').toLowerCase();
          if (cap.includes('paint')) {
            finalImageUrl = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80';
          } else if (cap.includes('interior') || cap.includes('wood')) {
            finalImageUrl = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80';
          } else if (cap.includes('plumb') || cap.includes('pipe')) {
            finalImageUrl = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80';
          } else if (cap.includes('electric') || cap.includes('wire')) {
            finalImageUrl = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80';
          } else if (cap.includes('found') || cap.includes('foot')) {
            finalImageUrl = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80';
          } else {
            finalImageUrl = 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80';
          }
        }

        const photo = await prisma.sitePhoto.create({
          data: {
            projectId,
            imageUrl: finalImageUrl,
            caption: caption || 'Site Inspection Proof',
            latitude: latitude ? Number(latitude) : null,
            longitude: longitude ? Number(longitude) : null,
          },
        });
        result.record = photo;
        break;
      }

      case 'expense': {
        const { category, itemName, amount, date } = payload || {};
        const expense = await prisma.expense.create({
          data: {
            projectId,
            category: (category || 'MATERIAL').toUpperCase(),
            itemName: itemName || 'Quick Site Expense',
            amount: parseFloat(amount) || 0,
            date: date ? new Date(date) : new Date(),
          },
        });
        result.record = expense;
        break;
      }

      default: {
        return NextResponse.json({ error: `Unsupported actionType: ${actionType}` }, { status: 400 });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('RECORD_DISPATCH_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch record action.' },
      { status: 500 }
    );
  }
}

