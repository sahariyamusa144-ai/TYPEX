import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TYPEX | Professional Typing Speed Test",
  description:
    "Improve your typing speed, accuracy, and keyboard skills with TYPEX. Practice with timed tests, difficulty levels, personal records, and detailed results.",
  keywords: [
    "TYPEX",
    "typing test",
    "typing speed test",
    "WPM test",
    "CPM test",
    "English typing practice",
    "keyboard practice",
    "typing accuracy",
  ],
  authors: [{ name: "Sahariya Ahmed Musa" }],
  applicationName: "TYPEX",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090a10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}