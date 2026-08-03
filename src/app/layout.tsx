import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Nunito: a rounded, warm, friendly typeface.
const nunito = Nunito({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ledger Personal Finance",
  description: "Track accounts, transactions, budgets, and savings goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
