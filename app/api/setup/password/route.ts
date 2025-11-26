import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function readAdminPasswordFromFile(): string | undefined {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    const match = /^ADMIN_PASSWORD=(.*)$/m.exec(content);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const config = await prisma.storeConfig.findFirst();
    const envPassword = process.env.ADMIN_PASSWORD ?? readAdminPasswordFromFile() ?? "barber123";
    const effectivePassword = config?.adminPassword ?? envPassword;
    if (currentPassword !== effectivePassword) {
      return NextResponse.json({ error: "Altes Passwort ist ungültig" }, { status: 401 });
    }

    const updated = await prisma.storeConfig.upsert({
      where: { id: config?.id ?? 1 },
      update: { adminPassword: newPassword },
      create: { id: config?.id ?? undefined, adminPassword: newPassword },
    });
    return NextResponse.json({ ok: true, id: updated.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
