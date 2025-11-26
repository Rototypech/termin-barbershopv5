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
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const serviceIdStr = searchParams.get("serviceId");
  if (!dateStr) return NextResponse.json([], { status: 200 });
  if (!serviceIdStr) return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  const serviceId = Number.parseInt(serviceIdStr, 10);
  if (Number.isNaN(serviceId)) return NextResponse.json({ error: "invalid serviceId" }, { status: 400 });
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const serviceDuration = service?.duration ?? 30;
  const day = new Date(`${dateStr}T00:00:00`);
  const dow = day.getDay();
  const wh = await prisma.workingHours.findUnique({ where: { dayOfWeek: dow } });
  if (wh && !wh.isOpen) return NextResponse.json([], { status: 200 });

  const toMinutes = (hm: string) => {
    const [hh, mm] = hm.split(":").map((x) => Number.parseInt(x, 10));
    return hh * 60 + mm;
  };
  const defaultStartMin = dow === 0 ? 0 : toMinutes("09:00");
  const defaultEndMin = dow === 0 ? 0 : toMinutes("17:00");
  const startMin = wh ? toMinutes(wh.startTime) : defaultStartMin;
  const endMin = wh ? toMinutes(wh.endTime) : defaultEndMin;
  if (dow === 0 && !wh) return NextResponse.json([], { status: 200 });

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

  const toLabel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const slots: { time: string; isBooked: boolean }[] = [];
  for (let start = startMin; start < endMin; start += 15) {
    const end = start + serviceDuration;
    const overClosing = end > endMin;
    const overlaps = bookedIntervals.some((bi) => start < bi.end && end > bi.start);
    const label = toLabel(start);
    slots.push({ time: label, isBooked: overClosing || overlaps });
  }
  return NextResponse.json(slots, { status: 200 });
}
