import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, projectId, projectCode } = body;

    // 1. Client Direct Access via Project ID
    const lookupId = (projectId || projectCode || '').trim();
    if (lookupId && !password) {
      // Find project by ID or name
      const project = await prisma.project.findFirst({
        where: {
          OR: [
            { id: lookupId },
            { id: { startsWith: lookupId, mode: 'insensitive' } },
            { id: { contains: lookupId, mode: 'insensitive' } },
            { name: { equals: lookupId, mode: 'insensitive' } },
          ],
        },
        include: {
          estimate: true,
          tasks: true,
          expenses: true,
          sitePhotos: { orderBy: { uploadedAt: 'desc' } },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: `No active construction project found matching Project ID: "${lookupId}". Please verify the code with your engineer.` },
          { status: 404 }
        );
      }

      // Resolve or find default client user
      let clientUser = await prisma.user.findFirst({
        where: { role: 'CLIENT' },
      });

      if (!clientUser) {
        clientUser = await prisma.user.findFirst({
          where: { email: 'client@buildsmart.ai' },
        });
      }

      const clientUserId = clientUser?.id || project.userId;
      const tokenPayload = {
        id: clientUserId,
        email: clientUser?.email || 'client@buildsmart.ai',
        role: 'CLIENT',
        isApproved: true,
        projectId: project.id,
        iat: Date.now(),
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

      return NextResponse.json({
        token,
        user: {
          id: clientUserId,
          name: `Client · ${project.name}`,
          email: clientUser?.email || 'client@buildsmart.ai',
          role: 'CLIENT',
          isApproved: true,
          projectId: project.id,
        },
        project,
      });
    }

    // 2. Standard Email & Password Authentication
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide either email and password, or enter a valid Project ID.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    // Generate a secure mobile session token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      iat: Date.now(),
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name || (user.role === 'ADMIN' ? 'Pankaj Suryawanshi' : 'Site Engineer'),
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error: any) {
    console.error('MOBILE_AUTH_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Authentication service failure.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or malformed Authorization header.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      if (!decoded?.id) {
        return NextResponse.json({ error: 'Invalid token payload.' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return NextResponse.json({ error: 'User no longer exists.' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name || 'Site Engineer',
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('MOBILE_AUTH_VERIFY_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to verify session.' }, { status: 500 });
  }
}

