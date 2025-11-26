import { PrismaClient } from "@prisma/client";
import ServicesClient from "./ServicesClient";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
  return <ServicesClient initial={services} />;
}
