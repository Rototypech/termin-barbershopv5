import { PrismaClient } from "@prisma/client";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function AdminOverview() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dow = now.getDay();
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - (dow === 0 ? 7 : dow)));
  const todayRows = await prisma.booking.findMany({ where: { date: { gte: startOfToday, lt: endOfToday } }, select: { status: true } });
  const todayCount = todayRows.filter((r) => String(r.status) === "BESTAETIGT" || String(r.status) === "ABGESCHLOSSEN").length;
  const weekRows = await prisma.booking.findMany({ where: { date: { gte: startOfToday, lt: endOfWeek } }, select: { status: true } });
  const weekCount = weekRows.filter((r) => String(r.status) === "BESTAETIGT" || String(r.status) === "ABGESCHLOSSEN").length;
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthItems = await prisma.booking.findMany({ where: { date: { gte: from, lt: to } }, include: { service: true } });
  const includeStatuses = new Set<string>(["BESTAETIGT", "ABGESCHLOSSEN"]);
  const monthVisits = monthItems.filter((b) => includeStatuses.has(String(b.status))).length;
  const monthRevenue = monthItems.reduce((sum, b) => includeStatuses.has(String(b.status)) ? sum + (b.service?.priceCHF ?? 0) : sum, 0);
  const dateStr = now.toLocaleDateString("de-CH", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 flex flex-col items-center">
      <div className="text-2xl text-[#C5A059] mb-4 text-center">Willkommen! Heute ist <span className="font-semibold">{dateStr}</span>.</div>
      <div className="text-lg mb-6 text-center">
        Sie haben heute <span className="text-[#C5A059] font-semibold">{todayCount}</span> vereinbarte Kundentermine.
        <br />
        Diese Woche erwarten Sie noch <span className="text-[#C5A059] font-semibold">{weekCount}</span> Besuche.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <div className="p-6 rounded-lg border border-[#C5A059] bg-black text-center">
          <div className="text-neutral-300 mb-2">Umsatz (Aktueller Monat)</div>
          <div className="text-3xl text-[#C5A059] font-semibold">CHF {monthRevenue}</div>
        </div>
        <div className="p-6 rounded-lg border border-[#C5A059] bg-black text-center">
          <div className="text-neutral-300 mb-2">Erbrachte Leistungen</div>
          <div className="text-3xl text-[#C5A059] font-semibold">{monthVisits}</div>
        </div>
      </div>
    </div>
  );
}
