"use client";

import { useEffect, useRef } from "react";

// Posiziona il contenitore che lo include a `top` px dall'alto al primo render
export function AutoScroll({ top }: { top: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (el) el.scrollTop = top;
  }, [top]);
  return <span ref={ref} hidden />;
}
