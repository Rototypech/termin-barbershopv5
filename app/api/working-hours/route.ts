import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const rows = await prisma.workingHours.findMany({ select: { dayOfWeek: true, isOpen: true, startTime: true, endTime: true } });
    return NextResponse.json(rows, { status: 200 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ error: msg || "Failed to load working hours" }, { status: 500 });
  }
}

