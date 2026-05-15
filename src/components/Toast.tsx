'use client';

import { useState, useEffect } from 'react';

interface ToastItem {
  id: number;
  icon: string;
  title: string;
  desc: string;
  cls: string;
  exiting?: boolean;
}

let nextId = 0;
const listeners: Set<(t: ToastItem[]) => void> = new Set();
let toasts: ToastItem[] = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function showToast(icon: string, title: string, desc: string, cls = '') {
  const t: ToastItem = { id: nextId++, icon, title, desc, cls };
  toasts = [...toasts, t];
  notify();
  setTimeout(() => {
    toasts = toasts.map((x) => (x.id === t.id ? { ...x, exiting: true } : x));
    notify();
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== t.id);
      notify();
    }, 250);
  }, 3500);
}

export default function ToastArea() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  return (
    <div className="fixed bottom-[18px] right-[18px] z-[300] flex flex-col gap-[7px]">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.cls} ${t.exiting ? 'out' : ''}`}
        >
          <span className="text-[15px] shrink-0">{t.icon}</span>
          <div>
            <strong className="block text-[13px] text-[var(--text)] font-semibold">{t.title}</strong>
            <span className="text-[11px] text-[var(--text2)]">{t.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
