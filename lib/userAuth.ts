import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface RequestAuth {
  userId: string | null;
  userEmail: string | null;
  role: 'ADMIN' | 'ENGINEER' | 'CLIENT';
  isAdmin: boolean;
  isEngineer: boolean;
  isClient: boolean;
}

export async function getRequestAuth(req: Request): Promise<RequestAuth> {
  let userId: string | null = null;
  let userEmail: string | null = null;
  let rawRole: string = '';

  // 1. Try NextAuth session (Web)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = (session.user as any)?.id || null;
      userEmail = session.user.email || null;
      rawRole = ((session.user as any)?.role || '').toUpperCase();
    }
  } catch {}

  // 2. Try Mobile Bearer token header (Authorization: Bearer <base64url>)
  if (!userId) {
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.replace('Bearer ', '').trim();
        const decoded = JSON.parse(Buffer.from(rawToken, 'base64url').toString('utf8'));
        if (decoded?.id) {
          userId = decoded.id;
          userEmail = decoded.email || null;
          rawRole = (decoded.role || '').toUpperCase();
        }
      }
    } catch {}
  }

  // 3. Try query parameters fallback (?userId=, ?email=, ?role=)
  if (!userId || !userEmail) {
    try {
      const url = new URL(req.url);
      const qId = url.searchParams.get('userId');
      const qEmail = url.searchParams.get('email') || url.searchParams.get('userEmail');
      const qRole = url.searchParams.get('role');

      if (qId && !userId) userId = qId;
      if (qEmail && !userEmail) userEmail = qEmail;
      if (qRole && !rawRole) rawRole = qRole.toUpperCase();
    } catch {}
  }

  // 4. Resolve against database if userEmail is found but userId or role is missing
  if (userEmail && (!userId || !rawRole)) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase() },
      });
      if (dbUser) {
        userId = dbUser.id;
        rawRole = (dbUser.role || '').toUpperCase();
      }
    } catch {}
  }

  // 5. Categorize Role
  const emailLower = (userEmail || '').toLowerCase();
  const isAdmin =
    rawRole === 'ADMIN' ||
    emailLower.includes('pankajsuryawanshi') ||
    emailLower.includes('admin@buildsmart.ai');

  const isClient =
    !isAdmin &&
    (rawRole === 'CLIENT' ||
      rawRole === 'CUSTOMER' ||
      rawRole === 'USER' && emailLower.includes('client') ||
      emailLower.includes('client@buildsmart.ai'));

  const isEngineer = !isAdmin && !isClient;

  const role: 'ADMIN' | 'ENGINEER' | 'CLIENT' = isAdmin
    ? 'ADMIN'
    : isClient
    ? 'CLIENT'
    : 'ENGINEER';

  return {
    userId,
    userEmail,
    role,
    isAdmin,
    isEngineer,
    isClient,
  };
}

