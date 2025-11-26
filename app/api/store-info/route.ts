import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const config = await prisma.storeConfig.findFirst();
    const email = process.env.ADMIN_CONTACT_EMAIL || "kontakt@barbershop-brienz.ch";
    return NextResponse.json({ email, hasConfig: !!config }, { status: 200 });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
