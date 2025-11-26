import type { Metadata } from "next";
import AdminLayoutClient from "../../components/admin/AdminLayoutClient";

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

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
