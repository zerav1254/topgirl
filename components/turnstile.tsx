"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// Sitekey widget Turnstile (data publik); secret ada di TURNSTILE_SECRET (env server).
export const TURNSTILE_SITEKEY = "0x4AAAAAAGV47r7qgRXuC_JC";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, string>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Widget eksplisit (bukan implicit `cf-turnstile`) supaya tetap ter-render
// setelah navigasi client-side — script tidak memindai ulang DOM.
export function Turnstile({ action }: { action: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !ref.current || widgetId.current) return;
    const api = window.turnstile;
    if (!api) return;
    widgetId.current = api.render(ref.current, {
      sitekey: TURNSTILE_SITEKEY,
      action,
      theme: "dark",
    });
    return () => {
      if (widgetId.current) {
        api.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [ready, action]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={ref} />
    </>
  );
}

// Token sekali pakai: setelah setiap percobaan submit (sukses/gagal) widget
// direset supaya attempt berikutnya memakai token baru.
export function resetTurnstile() {
  window.turnstile?.reset();
}
