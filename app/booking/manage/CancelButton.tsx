"use client";
import { useState } from "react";

export default function CancelButton({ token }: Readonly<{ token: string }>) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  async function cancel() {
    setLoading(true);
    try {
      const r = await fetch("/api/bookings/cancel-by-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await r.json();
      if (r.ok && data?.ok) {
        setStatus("Termin storniert");
        setTimeout(() => { if (typeof globalThis !== "undefined") globalThis.location?.reload(); }, 800);
      } else {
        setStatus("Fehler");
      }
    } catch {
      setStatus("Fehler");
    }
    setLoading(false);
  }
  return (
    <div className="flex flex-col gap-2">
      <button disabled={loading} onClick={cancel} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">Termin stornieren</button>
      {status && <div className="text-sm">{status}</div>}
    </div>
  );
}
