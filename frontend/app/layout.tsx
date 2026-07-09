import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripSmart — AI-Powered Flight + Hotel Bundles",
  description:
    "Find the best flight and hotel combo deals tailored to your budget. TripSmart uses AI to rank and recommend the most value-packed travel bundles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
