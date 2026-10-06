'use client';
import { usePathname } from 'next/navigation';
import TopBar from '@/components/TopBar';

const TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/projects': 'Projects',
  '/dashboard/estimation': 'AI-powered estimation',
  '/dashboard/planning': 'Project planning',
  '/dashboard/risk': 'AI risk analysis',
  '/dashboard/budget': 'Budget & expenses',
  '/dashboard/analytics': 'Analytics & reports',
  '/dashboard/weather': 'Weather intelligence',
  '/dashboard/chat': 'AI assistant',
  '/dashboard/documents': 'Documents & reports',
  '/dashboard/site': 'Site & field management',
  '/dashboard/admin/rates': 'Admin: material rates',
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'Project detail';

  return (
    <>
      <TopBar title={title} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </>
  );
}
