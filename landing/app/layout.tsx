import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Habibee — Keep Streaks, Build Better Habits",
  description:
    "Habibee helps you build and maintain daily habits with streaks, sub-habits, AI coaching, focus timers, and accountability hives. Download now on Android and iOS.",
  keywords: [
    "habit tracker",
    "streaks",
    "daily habits",
    "AI coach",
    "accountability",
    "focus timer",
    "habibee",
  ],
  icons: {
    icon: "/images/icon-nobg-white.png",
    apple: "/images/icon-nobg-white.png",
  },
  openGraph: {
    title: "Habibee — Keep Streaks, Build Better Habits",
    description:
      "Track habits, maintain streaks, and stay accountable with Habibee.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
