import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

async function requireAdmin() {
  const c = await cookies();
  const s = c.get("admin_session");
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth) return auth;
  const hours = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  return NextResponse.json(hours);
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body.items;
    const force = typeof body?.force === "boolean" ? body.force : false;
    console.log("HOURS UPDATE INPUT:", items, "force:", force);
    if (!Array.isArray(items)) return NextResponse.json({ error: "Payload must be an array" }, { status: 400 });

    if (!force) {
      const now = new Date();
      const bookings = await prisma.booking.findMany({ where: { date: { gt: now } } });
      const conflicts: { clientName: string; date: string; time: string; phone: string; email: string }[] = [];

      const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      for (const b of bookings) {
        const d = new Date(b.date);
        const wdStr = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Zurich", weekday: "short" }).format(d);
        const wd = weekdayMap[wdStr];
        const timeStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
        const dateStr = new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
        const rule = items.find((x: { dayOfWeek: number; isOpen: boolean; startTime: string; endTime: string }) => x.dayOfWeek === wd);
        if (rule) {
          if (!rule.isOpen) {
            conflicts.push({ clientName: b.clientName, date: dateStr, time: timeStr, phone: b.clientPhone, email: b.clientEmail });
          } else {
            const t = timeStr;
            const inRange = t >= rule.startTime && t <= rule.endTime;
            if (!inRange) {
              conflicts.push({ clientName: b.clientName, date: dateStr, time: timeStr, phone: b.clientPhone, email: b.clientEmail });
            }
          }
        }
      }

      if (conflicts.length > 0) {
        return NextResponse.json({ conflicts }, { status: 409 });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const day of items) {
        await tx.workingHours.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: { isOpen: day.isOpen, startTime: day.startTime, endTime: day.endTime },
          create: { dayOfWeek: day.dayOfWeek, isOpen: day.isOpen, startTime: day.startTime, endTime: day.endTime },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("HOURS UPDATE ERROR:", e);
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : "Failed to update working hours";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
