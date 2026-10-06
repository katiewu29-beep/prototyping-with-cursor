/**
 * Root layout component that wraps all pages in the application.
 * This layout:
 * - Sets up Geist fonts (both Sans and Mono variants)
 * - Configures metadata like title and favicon
 * - Provides the basic HTML structure
 * - Applies font variables to the entire app
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./styles/globals.css";

const geistSans = localFont({
  src: "./font-files/geist.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./font-files/geist-mono.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Katie's prototypes",
  description: "The home for all my prototypes",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✨</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
