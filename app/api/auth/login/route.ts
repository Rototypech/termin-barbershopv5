export const runtime = "nodejs";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { password } = body;
  function readAdminPasswordFromFile(): string | undefined {
    try {
      const envPath = path.join(process.cwd(), ".env");
      console.log("loginRoute.cwd", process.cwd());
      console.log("loginRoute.envPathExists", fs.existsSync(envPath));
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
  console.log("--- LOGIN DEBUG ---");
  console.log("hasProvidedPassword", typeof password === "string");
  console.log("providedPasswordLength", typeof password === "string" ? password.length : null);
  console.log("envPasswordSet", !!envPassword);
  console.log(
    "passwordsMatch",
    typeof password === "string" && effectivePassword ? password === effectivePassword : false
  );
  console.log("-------------------");
  if (!password || !effectivePassword || password !== effectivePassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("admin_session", "1", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });
  return res;
}
