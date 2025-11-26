import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const services = [
    { name: "Kinder (bis 13 Jahre)", priceCHF: 22, duration: 30 },
    { name: "Teenager (Alter 14–17)", priceCHF: 26, duration: 30 },
    { name: "Männer", priceCHF: 33, duration: 30 },
    { name: "Schneiden & Waschen", priceCHF: 38, duration: 45 },
    { name: "Haare schneiden mit Bart", priceCHF: 53, duration: 45 },
    { name: "Bart", priceCHF: 20, duration: 15 },
    { name: "Augenbrauen", priceCHF: 20, duration: 15 },
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: { priceCHF: s.priceCHF, duration: s.duration },
      create: s,
    });
  }
  console.log("Preisliste aktualisiert: 7 Leistungen");

  const whDefaults = [
    { dayOfWeek: 0, isOpen: false, startTime: "00:00", endTime: "00:00" },
    { dayOfWeek: 1, isOpen: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 2, isOpen: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 3, isOpen: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 4, isOpen: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 5, isOpen: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 6, isOpen: true, startTime: "09:00", endTime: "17:00" },
  ];
  for (const d of whDefaults) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: d.dayOfWeek },
      update: { isOpen: d.isOpen, startTime: d.startTime, endTime: d.endTime, breakStart: null, breakEnd: null },
      create: { dayOfWeek: d.dayOfWeek, isOpen: d.isOpen, startTime: d.startTime, endTime: d.endTime, breakStart: null, breakEnd: null },
    });
  }
  console.log("Öffnungszeiten aktualisiert: 7 Tage");

  const today = new Date();
  const names = [
    "Hans Müller",
    "Heidi Schmid",
    "Peter Weber",
    "Luca Meier",
    "Anna Keller",
    "Jonas Baumann",
    "Nina Frei",
    "Marco Fischer",
    "Sofia Schneider",
    "Fabian Roth",
  ];
  const allServices = await prisma.service.findMany({ select: { id: true } });
  if (allServices.length === 0) {
    throw new Error("Keine Leistungen zum Zuordnen im Seed");
  }

  const bookingsCount = 50;
  for (let i = 0; i < bookingsCount; i++) {
    const offsetDays = Math.floor(Math.random() * 32) - 1; // od wczoraj do +30 dni
    const base = new Date(today);
    base.setDate(today.getDate() + offsetDays);
    // Godziny 09:00 - 17:00
    const hour = 9 + Math.floor(Math.random() * 9);
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    base.setHours(hour, minute, 0, 0);

    const serviceId = allServices[Math.floor(Math.random() * allServices.length)].id;
    const name = names[Math.floor(Math.random() * names.length)];
    const statusRand = Math.random();
    const status = statusRand < 0.8 ? "BESTAETIGT" : "STORNIERT";

    const phone = "+41" + String(760000000 + Math.floor(Math.random() * 10000000));
    const emailLocal = name.toLowerCase().trim().split(/\s+/).join(".");
    const email = `${emailLocal}@example.ch`;

    await prisma.booking.create({
      data: {
        serviceId,
        date: base,
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        status,
        notes: Math.random() < 0.3 ? "Bitte pünktlich" : null,
      },
    });
  }
  console.log(`Es wurden ${bookingsCount} Beispielbuchungen hinzugefügt`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
