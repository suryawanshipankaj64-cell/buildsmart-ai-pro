import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const isAdmin = (session.user as any).role === 'ADMIN';

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </div>
  );
}
