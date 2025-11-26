"use client";
import { useState } from "react";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  

  async function changePassword() {
    setStatus("");
    const r = await fetch("/api/setup/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (r.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setStatus("Passwort wurde geändert. Bitte beim nächsten Login verwenden.");
      alert("Passwort wurde geändert. Bitte beim nächsten Login verwenden.");
    } else {
      const data = await r.json().catch(() => ({ error: "Fehler" }));
      setStatus(data.error || "Fehler bei der Passwortänderung");
    }
  }

  

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <h1 className="text-2xl text-[#C5A059] mb-6">Admin – Einstellungen</h1>
      <div className="mb-6" />

      

      

      <div className="max-w-xl space-y-6">
        <div>
          <div className="text-lg text-[#C5A059] mb-3">Sicherheit / Passwort ändern</div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Aktuelles Passwort"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-white focus:border-[#C5A059]"
            />
            <input
              type="password"
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-white focus:border-[#C5A059]"
            />
            <div className="flex gap-3">
              <button
                onClick={changePassword}
                className="px-4 py-2 rounded bg-[#C5A059] text-black disabled:opacity-50"
                disabled={!currentPassword || !newPassword}
              >
                Passwort ändern
              </button>
              <button
                onClick={() => { setCurrentPassword(""); setNewPassword(""); setStatus(""); }}
                className="px-4 py-2 rounded border border-neutral-700"
              >
                Zurücksetzen
              </button>
            </div>
            {status && <div className="text-sm">{status}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
