import type { Metadata } from "next";
import AdminLayoutClient from "../../components/admin/AdminLayoutClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Barber Admin Panel",
  manifest: "/admin-manifest.json",
  icons: {
    icon: "/admin/favicon.ico",
    apple: "/admin/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Admin",
    statusBarStyle: "black-translucent",
  },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const c = await cookies();
  const s = c.get("admin_session");
  if (!s) {
    redirect("/login");
  }
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
