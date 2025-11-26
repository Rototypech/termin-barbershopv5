"use client";
import Link from "next/link";
import { useState } from "react";
import { Calendar, BookOpen, Scissors, Clock, Settings, Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";

export default function AdminLayoutClient({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);

  const Nav = (
    <nav className="h-full overflow-y-auto flex flex-col gap-2 p-4 bg-neutral-950">
      <div className="text-[#C5A059] text-xl mb-4">Admin</div>
      <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-900 text-neutral-100" onClick={() => setOpen(false)}>
        <Calendar size={18} className="text-[#C5A059]" /> Dashboard
      </Link>
      <Link href="/admin/bookings" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-900 text-neutral-100" onClick={() => setOpen(false)}>
        <BookOpen size={18} className="text-[#C5A059]" /> Buchungen
      </Link>
      <Link href="/admin/services" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-900 text-neutral-100" onClick={() => setOpen(false)}>
        <Scissors size={18} className="text-[#C5A059]" /> Leistungen
      </Link>
      <Link href="/admin/hours" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-900 text-neutral-100" onClick={() => setOpen(false)}>
        <Clock size={18} className="text-[#C5A059]" /> Öffnungszeiten
      </Link>
      <Link href="/admin/setup" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-900 text-neutral-100" onClick={() => setOpen(false)}>
        <Settings size={18} className="text-[#C5A059]" /> Konfiguration
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-black">
        <div className="text-[#C5A059]">Admin</div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="px-3 py-2 rounded border border-[#C5A059] text-[#C5A059]" aria-label="Menu">
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="border-r border-[#C5A059]">
            {Nav}
            <div className="p-4">
              <SheetClose className="px-3 py-2 rounded border border-neutral-700 text-white">Schließen</SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex">
        <div className="hidden md:block w-64 sticky top-16 h-[calc(100vh-4rem)] border-r border-neutral-800 bg-black">{Nav}</div>
        <main className="flex-1 p-6 w-full">{children}</main>
      </div>
    </div>
  );
}
