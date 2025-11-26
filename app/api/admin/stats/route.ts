import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  try {
    const items = await prisma.booking.findMany({
      where: { date: { gte: from, lt: to } },
      include: { service: true },
    });
    const includeStatus = new Set<string>(["BESTAETIGT", "ABGESCHLOSSEN"]);
    const visits = items.filter((b) => includeStatus.has(b.status)).length;
    const revenue = items.reduce((sum, b) => {
      if (includeStatus.has(b.status)) return sum + (b.service?.priceCHF ?? 0);
      return sum;
    }, 0);
    return NextResponse.json({ monthRevenue: revenue, monthVisits: visits }, { status: 200 });
  } catch {
    return NextResponse.json({ monthRevenue: 0, monthVisits: 0 }, { status: 200 });
  }
}
