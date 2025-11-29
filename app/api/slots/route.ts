import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

export function toMinutes(hm: string) {
  const [hh, mm] = hm.split(":").map((x) => Number.parseInt(x, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
  return hh * 60 + mm;
}

export function getZurichTime(date: Date): string {
  const s = date.toLocaleTimeString("de-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", hour12: false });
  return s.replaceAll(".", ":");
}

export function toLabel(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function computeBookedIntervals(bookings: Array<{ date: Date; service?: { duration?: number } | null }>) {
  return bookings.map((b) => {
    const startLabel = getZurichTime(new Date(b.date));
    const [hh, mm] = startLabel.split(":");
    const start = Number.parseInt(hh, 10) * 60 + Number.parseInt(mm, 10);
    const dur = b.service?.duration ?? 30;
    return { start, end: start + dur };
  });
}

export function computeBreakIntervals(wh: { breakStart?: string | null; breakEnd?: string | null }) {
  const out: { start: number; end: number }[] = [];
  if (wh?.breakStart && wh?.breakEnd) {
    const bs = toMinutes(wh.breakStart);
    const be = toMinutes(wh.breakEnd);
    if (bs < be) out.push({ start: bs, end: be });
  }
  return out;
}

async function computeManualIntervals(dateStr: string) {
  try {
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);
    const blocks = await prisma.blockedSlot.findMany({ where: { date: { gte: startOfDay, lte: endOfDay } } });
    return blocks.map((b) => ({ start: toMinutes(b.startTime), end: toMinutes(b.endTime) }));
  } catch {
    return [] as { start: number; end: number }[];
  }
}

export function buildSlots(startMin: number, endMin: number, serviceDuration: number, booked: { start: number; end: number }[], brks: { start: number; end: number }[], manual: { start: number; end: number }[], nowMin: number, isToday: boolean) {
  const slots: { time: string; isBooked: boolean }[] = [];
  for (let start = startMin; start < endMin; start += 15) {
    const end = start + serviceDuration;
    const overClosing = end > endMin;
    const overlaps = booked.some((bi) => start < bi.end && end > bi.start);
    const overlapsBreak = brks.some((bi) => start < bi.end && end > bi.start);
    const overlapsManual = manual.some((bi) => start < bi.end && end > bi.start);
    const label = toLabel(start);
    const past = isToday && start < nowMin;
    slots.push({ time: label, isBooked: overClosing || overlaps || overlapsBreak || overlapsManual || past });
  }
  return slots;
}

export function parseQuery(searchParams: URLSearchParams) {
  const dateStr = searchParams.get("date");
  const serviceIdStr = searchParams.get("serviceId");
  const durationStr = searchParams.get("duration");
  let serviceDuration = 30;
  const serviceId = serviceIdStr ? Number.parseInt(serviceIdStr, 10) : undefined;
  const durationOverride = durationStr ? Number.parseInt(durationStr, 10) : undefined;
  if (typeof durationOverride === "number" && !Number.isNaN(durationOverride) && durationOverride > 0) serviceDuration = durationOverride;
  return { dateStr, serviceId, serviceDuration };
}

export async function getWorkingHoursForDate(dateStr: string) {
  const parts = dateStr.split("-").map((x) => Number.parseInt(x, 10));
  const dow = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
  const wh = await prisma.workingHours.findUnique({ where: { dayOfWeek: dow } });
  return wh;
}

export function computeNowZurich(now: Date, dateStr: string) {
  const nowParts = new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(now);
  const ny = Number(nowParts.find((p) => p.type === "year")?.value ?? now.getFullYear());
  const nm = Number(nowParts.find((p) => p.type === "month")?.value ?? (now.getMonth() + 1));
  const nd = Number(nowParts.find((p) => p.type === "day")?.value ?? now.getDate());
  const nh = Number(nowParts.find((p) => p.type === "hour")?.value ?? now.getHours());
  const nmin = Number(nowParts.find((p) => p.type === "minute")?.value ?? now.getMinutes());
  const todayZurich = `${String(ny)}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
  const nowMinutesZurich = nh * 60 + nmin;
  return { isToday: dateStr === todayZurich, nowMinutesZurich };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { dateStr, serviceId, serviceDuration } = parseQuery(searchParams);
    if (!dateStr) return NextResponse.json([], { status: 200 });
    let finalDuration = serviceDuration;
    if (typeof serviceId === "number") {
      if (Number.isNaN(serviceId)) return NextResponse.json({ error: "invalid serviceId" }, { status: 400 });
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      finalDuration = service?.duration ?? finalDuration;
    }
    const wh = await getWorkingHoursForDate(dateStr);
    if (!wh?.isOpen) return NextResponse.json([], { status: 200 });
    const startMin = toMinutes(wh.startTime);
    const endMin = toMinutes(wh.endTime);
    const bookings = await prisma.booking.findMany({ where: { date: { gte: new Date(`${dateStr}T00:00:00`), lt: new Date(`${dateStr}T23:59:59.999`) }, status: BookingStatus.BESTAETIGT }, include: { service: true } });
    const bookedIntervals = computeBookedIntervals(bookings as Array<{ date: Date; service?: { duration?: number } | null }>);
    const breakIntervals = computeBreakIntervals(wh);
    const manualIntervals = await computeManualIntervals(dateStr);
    const { isToday, nowMinutesZurich } = computeNowZurich(new Date(), dateStr);
    const slots = buildSlots(startMin, endMin, finalDuration, bookedIntervals, breakIntervals, manualIntervals, nowMinutesZurich, isToday);
    return NextResponse.json(slots, { status: 200 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ error: msg || "Failed to compute slots" }, { status: 500 });
  }
}
