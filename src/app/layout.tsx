import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Goliath Portal",
  description: "Control plane for GoliathOmics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
