"use client";
import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("cookie_consent");
      setTimeout(() => setVisible(v !== "true"), 0);
    } catch {}
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-4xl m-4 p-4 rounded-lg border border-[#C5A059] bg-neutral-950 text-neutral-100 flex items-center justify-between gap-3">
        <div>Wir verwenden Cookies, um den bestmöglichen Service zu gewährleisten.</div>
        <button
          className="px-4 py-2 rounded bg-[#C5A059] text-black"
          onClick={() => {
            try { localStorage.setItem("cookie_consent", "true"); } catch {}
            setVisible(false);
          }}
        >Akzeptieren</button>
      </div>
    </div>
  );
}
