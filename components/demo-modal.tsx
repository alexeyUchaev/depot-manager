'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

const subscribe = () => () => {};

interface DemoModalProps {
  onClose: () => void;
}

export function DemoModal({ onClose }: DemoModalProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
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
        <div className="relative w-full sm:max-w-md bg-card rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-card-foreground">This is a demo</h2>
            <p className="text-sm text-muted-foreground">
              Use AI to work with DepotAI. Manual creation is disabled in this
              demo — just ask the AI assistant to create or manage your items
              and it will handle the rest.
            </p>
            <button
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
            >
              Got it
            </button>
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
