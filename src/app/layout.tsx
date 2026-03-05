// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Root Layout
//   "the garden gate" 🌸
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GenGo! 🌸 Language Garden",
  description: "Grow your language skills, one flower at a time~",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${josefin.variable} antialiased`} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
        <ThemeProvider>
          <Navigation />
          <main className="min-h-screen pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
