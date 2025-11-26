import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { sendBookingConfirmation } from "../../../lib/email";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({ include: { service: true }, orderBy: { date: "desc" } });
    return NextResponse.json(bookings, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceId, date, clientName, clientEmail, clientPhone, notes } = body;
    const created = await prisma.$transaction(async (tx) => {
      const when = new Date(date);
      const exists = await tx.booking.count({ where: { date: when } });
      if (exists > 0) {
        throw new Error("CONFLICT");
      }
      return tx.booking.create({
        data: {
          serviceId,
          date: when,
          clientName,
          clientEmail,
          clientPhone,
          notes,
          status: BookingStatus.BESTAETIGT,
        },
        include: { service: true },
      });
    });
    const token = randomUUID();
    try {
      await prisma.$executeRawUnsafe(`UPDATE "Booking" SET "cancellationToken"='${token}' WHERE id=${created.id} AND "cancellationToken" IS NULL`);
    } catch {}
    try {
      await sendBookingConfirmation({ email: created.clientEmail, name: created.clientName, date: new Date(created.date), serviceName: created.service?.name, token });
    } catch (e) {
      console.error("sendBookingConfirmation error", e);
    }
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "true";
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    if (msg === "CONFLICT") {
      return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }
    return NextResponse.json(debug ? { error: msg } : { error: "Failed to create booking" }, { status: 500 });
  }
}
