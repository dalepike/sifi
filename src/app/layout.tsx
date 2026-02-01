import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiFi - Inventory Tracker",
  description: "Track physical objects and containers across multiple locations using QR codes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
