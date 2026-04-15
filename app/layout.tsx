import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FPLS Inspection Platform",
  description: "Fire protection and life safety inspection management"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
