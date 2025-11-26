import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { service: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(bookings);
}
