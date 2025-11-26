export const runtime = "nodejs";
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { password } = body;
  function readAdminPasswordFromFile(): string | undefined {
    try {
      const envPath = path.join(process.cwd(), ".env");
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^ADMIN_PASSWORD=(.*)$/m);
      return match ? match[1].trim() : undefined;
    } catch {
      return undefined;
    }
  }
  const envPassword = process.env.ADMIN_PASSWORD ?? readAdminPasswordFromFile() ?? "barber123";
  const config = await prisma.storeConfig.findFirst();
  const effectivePassword = config?.adminPassword ?? envPassword;
  let ok = false;
  if (typeof password === "string" && effectivePassword) {
    try {
      ok = await bcrypt.compare(password, effectivePassword);
    } catch {
      ok = false;
    }
    if (!ok && password === effectivePassword) {
      try {
        const hash = await bcrypt.hash(password, 10);
        await prisma.storeConfig.upsert({
          where: { id: config?.id ?? 1 },
          update: { adminPassword: hash },
          create: { id: config?.id ?? undefined, adminPassword: hash },
        });
        ok = true;
      } catch {
        ok = true;
      }
    }
  }
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("admin_session", "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60,
    path: "/",
  });
  return res;
}
