import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Ping",
  description: "Delegate tasks and let Ping follow up automatically."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html className="dark" lang="en">
        <body className={`${inter.variable} font-sans text-text antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
