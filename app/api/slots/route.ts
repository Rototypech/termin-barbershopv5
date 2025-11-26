import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();


function getZurichTime(date: Date): string {
  const s = date.toLocaleTimeString("de-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return s.replace(".", ":");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const serviceIdStr = searchParams.get("serviceId");
    const durationStr = searchParams.get("duration");
    if (!dateStr) return NextResponse.json([], { status: 200 });
    let serviceDuration = 30;
    if (serviceIdStr) {
      const serviceId = Number.parseInt(serviceIdStr, 10);
      if (Number.isNaN(serviceId)) return NextResponse.json({ error: "invalid serviceId" }, { status: 400 });
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      serviceDuration = service?.duration ?? 30;
    } else if (durationStr) {
      const d = Number.parseInt(durationStr, 10);
      if (!Number.isNaN(d) && d > 0) serviceDuration = d;
    }
    const day = new Date(`${dateStr}T00:00:00`);
    const dow = day.getDay();
    const wh = await prisma.workingHours.findUnique({ where: { dayOfWeek: dow } });
    if (!wh || !wh.isOpen) return NextResponse.json([], { status: 200 });

    const toMinutes = (hm: string) => {
      const [hh, mm] = hm.split(":").map((x) => Number.parseInt(x, 10));
      if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
      return hh * 60 + mm;
    };
    const startMin = toMinutes(wh.startTime);
    const endMin = toMinutes(wh.endTime);

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(`${dateStr}T00:00:00`),
          lt: new Date(`${dateStr}T23:59:59.999`),
        },
        status: BookingStatus.BESTAETIGT,
      },
      include: { service: true },
    });
    const bookedIntervals = bookings.map((b) => {
      const startLabel = getZurichTime(new Date(b.date));
      const [hh, mm] = startLabel.split(":");
      const start = Number.parseInt(hh, 10) * 60 + Number.parseInt(mm, 10);
      const dur = b.service?.duration ?? 30;
      return { start, end: start + dur };
    });

    const breakIntervals: { start: number; end: number }[] = [];
    if (wh?.breakStart && wh?.breakEnd) {
      const bs = toMinutes(wh.breakStart);
      const be = toMinutes(wh.breakEnd);
      if (bs < be) breakIntervals.push({ start: bs, end: be });
    }

    let manualIntervals: { start: number; end: number }[] = [];
    try {
      const startOfDay = new Date(`${dateStr}T00:00:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999`);
      const blocks = await prisma.blockedSlot.findMany({ where: { date: { gte: startOfDay, lte: endOfDay } } });
      manualIntervals = blocks.map((b) => ({ start: toMinutes(b.startTime), end: toMinutes(b.endTime) }));
    } catch {
      manualIntervals = [];
    }

    const toLabel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const slots: { time: string; isBooked: boolean }[] = [];
    for (let start = startMin; start < endMin; start += 15) {
      const end = start + serviceDuration;
      const overClosing = end > endMin;
      const overlaps = bookedIntervals.some((bi) => start < bi.end && end > bi.start);
      const overlapsBreak = breakIntervals.some((bi) => start < bi.end && end > bi.start);
      const overlapsManual = manualIntervals.some((bi) => start < bi.end && end > bi.start);
      const label = toLabel(start);
      slots.push({ time: label, isBooked: overClosing || overlaps || overlapsBreak || overlapsManual });
    }
    return NextResponse.json(slots, { status: 200 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ error: msg || "Failed to compute slots" }, { status: 500 });
  }
}
