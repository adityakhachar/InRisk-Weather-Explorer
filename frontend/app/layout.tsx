// frontend/app/layout.tsx (REVISED)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InRisk Weather Explorer",
  description: "Full-Stack Assessment Solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}> 
      {/* Increased font-size and smoother background color */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-800 text-base`} 
      >
        {children}
      </body>
    </html>
  );
}