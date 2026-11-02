"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { key: string; label: string; href: string };

export function ViewMenu({ items, current }: { items: Item[]; current: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = items.find((i) => i.key === current)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-500/10 dark:border-neutral-700"
      >
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-40 rounded-lg border border-neutral-300 bg-background py-2 shadow-lg dark:border-neutral-700"
        >
          {items.map((i) => (
            <li key={i.key} role="none">
              <Link
                role="menuitem"
                href={i.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm hover:bg-neutral-500/10 ${
                  i.key === current ? "font-medium text-emerald-600" : ""
                }`}
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
