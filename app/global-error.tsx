"use client";
import "./globals.css";
import { PhoneOff } from "lucide-react";

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl p-8 rounded-lg border border-[#C5A059] bg-black text-center space-y-4">
          <div className="flex justify-center">
            <PhoneOff className="w-12 h-12 text-[#C5A059]" />
          </div>
          <div className="text-2xl text-[#C5A059]">Entschuldigung, ein technischer Fehler ist aufgetreten.</div>
          <div className="text-neutral-200">Aufgrund technischer Probleme ist eine Online-Buchung derzeit leider nicht möglich.</div>
          <div className="text-neutral-300">Bitte kontaktieren Sie uns telefonisch:</div>
          <a href="tel:0339517221" className="inline-block text-3xl font-semibold text-[#C5A059]">033 951 72 21</a>
          <div>
            <button className="px-4 py-2 rounded bg-[#C5A059] text-black" onClick={() => reset()}>Seite neu laden</button>
          </div>
        </div>
      </body>
    </html>
  );
}
