import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const items = await prisma.blockedSlot.findMany({ where: { date: { gte: start } }, orderBy: { date: "asc" } });
    return NextResponse.json(items, { status: 200 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ error: msg || "Failed to load blocked slots" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { date, startTime, endTime, reason } = (await req.json()) as { date: string; startTime: string; endTime: string; reason?: string };
    const d = new Date(date);
    if (!date || Number.isNaN(d.getTime()) || !startTime || !endTime) {
      return NextResponse.json({ error: "invalid input" }, { status: 400 });
    }
    const created = await prisma.blockedSlot.create({ data: { date: d, startTime, endTime, reason } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ error: msg || "Failed to create blocked slot" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    const id = idStr ? Number.parseInt(idStr, 10) : NaN;
    if (!id || Number.isNaN(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
    await prisma.blockedSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ error: msg || "Failed to delete blocked slot" }, { status: 500 });
  }
}

