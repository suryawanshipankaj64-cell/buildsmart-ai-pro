'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Calculator,
  Calendar,
  ShieldAlert,
  Receipt,
  CloudSun,
  MessageSquare,
  FileText,
  Sliders,
  HardHat,
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'AI Estimation', href: '/dashboard/estimation', icon: Calculator },
    { name: 'Planning', href: '/dashboard/planning', icon: Calendar },
    { name: 'Risk Analysis', href: '/dashboard/risk', icon: ShieldAlert },
    { name: 'Weather', href: '/dashboard/weather', icon: CloudSun },
    { name: 'Budget & Expenses', href: '/dashboard/budget', icon: Receipt },
    { name: 'AI Assistant', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    // Admin Rate Controls added here
    { name: 'Admin Management', href: '/dashboard/admin', icon: Sliders },
  ];

  return (
    <aside className="flex w-64 flex-col justify-between border-r border-blueprint-line bg-navy-900/60 p-4 text-paper">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-teal text-navy-950 shadow-md">
            <HardHat size={20} />
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-tight text-paper">
              BuildSmart <span className="text-signal-teal">AI</span>
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-signal-teal/15 font-semibold text-signal-teal shadow-sm'
                    : 'text-signal-slate hover:bg-navy-800 hover:text-paper'
                }`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}