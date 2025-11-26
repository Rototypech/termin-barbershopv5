import { PrismaClient } from "@prisma/client";
import HoursClient from "./HoursClient";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminHours() {
  const hours = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 space-y-6">
      <HoursClient initial={hours} />
    </div>
  );
}
