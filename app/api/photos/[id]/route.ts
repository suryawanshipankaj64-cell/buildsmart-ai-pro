import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot delete photos.' },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');

    if (!session?.user && !authHeader && !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photo = await prisma.sitePhoto.findUnique({
      where: { id: params.id },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    await prisma.sitePhoto.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error: any) {
    console.error('DELETE_PHOTO_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

