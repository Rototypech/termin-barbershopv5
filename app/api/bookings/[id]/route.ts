import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const idNum = Number(id);
  try {
    console.log("[PATCH /api/bookings/:id]", { id: idNum });
    const body = await req.json();
    console.log("[PATCH body]", body);
    const debugToken = new URL(req.url).searchParams.get("debugToken") === "true";
    if (!body || typeof body.status !== "string") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    if (body.status !== "STORNIERT" && body.status !== "BESTAETIGT" && body.status !== "NO_SHOW" && body.status !== "ABGESCHLOSSEN") {
      return NextResponse.json({ error: "Unsupported status" }, { status: 400 });
    }
    const status = body.status as BookingStatus;
    const updated = await prisma.booking.update({ where: { id: idNum }, data: { status } });
    if (debugToken) {
      try {
        const rowsUnknown = (await prisma.$queryRawUnsafe(`SELECT "cancellationToken" FROM "Booking" WHERE id = ${idNum} LIMIT 1`)) as unknown;
        const rows = (Array.isArray(rowsUnknown) ? rowsUnknown : []) as { cancellationToken: string | null }[];
        return NextResponse.json({ ...updated, cancellationToken: rows[0]?.cancellationToken ?? null }, { status: 200 });
      } catch {}
    }
    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
