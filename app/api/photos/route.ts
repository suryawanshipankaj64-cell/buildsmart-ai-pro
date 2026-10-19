import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

import { getConstructionFallbackImage } from '@/lib/fallbackImages';

export async function GET(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    const { searchParams } = new URL(req.url);
    const queryProjectId = searchParams.get('projectId');
    const targetProjectId = auth.isClient
      ? (auth.projectId || queryProjectId)
      : queryProjectId;

    let whereClause: any = {};
    if (targetProjectId) {
      whereClause.projectId = targetProjectId;
    } else if (auth.isClient && auth.userId) {
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

    // Sanitize captions so legacy client-side substring matching cannot bleed Planning photos into other phases
    const sanitizedPhotos = photos.map((p) => {
      let cap = p.caption || '';
      if (cap.startsWith('[Planning]') && /\bwork\b/i.test(cap)) {
        cap = cap.replace(/\bwork\b/gi, 'site');
      }
      return { ...p, caption: cap };
    });

    return NextResponse.json(sanitizedPhotos);
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
      finalImageUrl = getConstructionFallbackImage(caption || 'Planning', caption || 'Site Inspection Proof');
    }

    // Sanitize caption so generic trade words like 'work' in non-trade phases don't bleed into other phases
    let sanitizedCaption = caption?.trim() || null;
    if (sanitizedCaption && sanitizedCaption.startsWith('[Planning]') && /\bwork\b/i.test(sanitizedCaption)) {
      sanitizedCaption = sanitizedCaption.replace(/\bwork\b/gi, 'site');
    }

    const photo = await prisma.sitePhoto.create({
      data: {
        projectId,
        imageUrl: finalImageUrl,
        caption: sanitizedCaption,
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