'use client';
import { X } from 'lucide-react';

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-blueprint-line bg-navy-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-blueprint-line px-5 py-4">
          <h2 className="font-display text-lg text-paper">{title}</h2>
          <button onClick={onClose} className="text-signal-slate hover:text-paper transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
