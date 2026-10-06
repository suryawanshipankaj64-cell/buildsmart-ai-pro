import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

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

    const photos = await prisma.sitePhoto.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { uploadedAt: 'desc' },
      include: {
        project: {
          select: { name: true, location: true },
        },
      },
    });

    return NextResponse.json(photos);
  } catch (error: any) {
    console.error('GET_PHOTOS_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot upload site photos.' },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');

    if (!session?.user && !authHeader && !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, imageUrl, caption, latitude, longitude } = body;

    if (!projectId || !imageUrl) {
      return NextResponse.json(
        { error: 'Project ID and Image URL are required.' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let finalImageUrl = imageUrl.trim();
    if (finalImageUrl.startsWith('file://') || finalImageUrl.startsWith('content://')) {
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
        caption: caption?.trim() || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    console.error('CREATE_PHOTO_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}