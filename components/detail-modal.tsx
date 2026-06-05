'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type DetailRow = { label: string; value: React.ReactNode };

interface DetailModalProps {
  title: string;
  header?: React.ReactNode;
  badges?: React.ReactNode;
  rows: DetailRow[];
  children?: React.ReactNode;
  onClose: () => void;
}

export function DetailModal({ title, header, badges, rows, children, onClose }: DetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed top-40 w-full px-2 z-50 flex items-end sm:items-center justify-center">
        <button
          onClick={onClose}
          className="fixed top-40 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative w-full sm:max-w-md bg-white rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="p-6 space-y-5">
            {header}
            <h2 className="text-xl font-bold text-gray-900 wrap-break-word">{title}</h2>
            {badges}
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 text-sm gap-3">
                  <dt className="text-gray-500 shrink-0">{row.label}</dt>
                  <dd className="font-medium text-gray-900 text-right wrap-break-word min-w-0">{row.value}</dd>
                </div>
              ))}
            </div>
            {children}
          </div>
        </div>
      </div>
      <div
        className="absolute z-40 top-0 bottom-0 w-full h-[3000px] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
    </>,
    document.body
  );
}