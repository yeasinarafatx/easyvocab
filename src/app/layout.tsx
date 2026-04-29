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
  title: "Vocab Speak - Master English Vocabulary",
  description: "Learn English words fast with Interactive spelling, voice pronunciation, and flashcard practice",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "Vocab Speak - Master English Vocabulary",
    description: "Learn English words fast with Interactive spelling, voice pronunciation, and flashcard practice",
    url: "https://easyvocab.com",
    siteName: "Vocab Speak",
    images: [
      {
        url: "/og/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vocab Speak Logo",
      },
    ],
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="w-full border-b border-white/6 bg-transparent">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-bold text-slate-100">VocabSpeak</a>
            </div>
            <nav className="flex items-center gap-3">
              <a href="/resources/free" className="rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/6">Free PDF/Ebooks</a>
              <a href="/resources/paid" className="rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/6">Paid PDF/Ebooks</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
