import type { Metadata } from "next";
import { Geist, Geist_Mono, Italiana } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const italiana = Italiana({
  variable: "--font-amethyst-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.yoursparklesuite.com"),
  applicationName: "Sparkle Suite",
  title: {
    default: "Sparkle Suite",
    template: "%s | Sparkle Suite",
  },
  icons: {
    icon: [
      {
        url: "/icon",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${italiana.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
