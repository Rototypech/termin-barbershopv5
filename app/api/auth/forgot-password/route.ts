import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { sendEmail } from "../../../../lib/email";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const token = randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    const existing = await prisma.storeConfig.findFirst();
    const updated = existing
      ? await prisma.storeConfig.update({ where: { id: existing.id }, data: { resetToken: token, resetTokenExpiry: expiry } })
      : await prisma.storeConfig.create({ data: { resetToken: token, resetTokenExpiry: expiry } });
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${base}/auth/reset/${token}`;
    console.log("========================================");
    console.log("🔑 MAGIC LINK DO RESETU HASŁA:");
    console.log(resetLink);
    console.log("========================================");
    const to = process.env.ADMIN_CONTACT_EMAIL || "kontakt@barbershop-brienz.ch";
    const subj = "Reset hasła do panelu Admina";
    const html = `
      <div style="font-family: Arial, sans-serif; background:#0f0f0f; color:#fff; padding:24px;">
        <div style="max-width:560px; margin:0 auto; border:1px solid #C5A059; border-radius:12px; padding:24px; background:#141414;">
          <h2 style="margin:0 0 12px; color:#C5A059;">Reset hasła</h2>
          <p style="margin:0 0 12px;">Kliknij, aby zresetować hasło administratora:</p>
          <div style="margin:20px 0;">
            <a href="${resetLink}" style="display:inline-block; padding:10px 14px; background:#C5A059; color:#000; text-decoration:none; border-radius:8px; font-weight:600;">Resetuj hasło</a>
          </div>
          <hr style="border-color:#2a2a2a; margin:20px 0;" />
          <p style="margin:0; font-size:12px; color:#bdbdbd;">Jeśli nie inicjowałeś resetu, zignoruj tę wiadomość.</p>
        </div>
      </div>
    `;
    try { await sendEmail({ to, subject: subj, html, name: "Admin" }); } catch {}
    return NextResponse.json({ ok: true, id: updated.id }, { status: 200 });
  } catch (e) {
    const msg = typeof e === "object" && e !== null && "message" in e ? (e as { message: string }).message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
