import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const c = await cookies();
  const s = c.get("admin_session");
  if (!s) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
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
