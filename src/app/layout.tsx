import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getMetaPixelId, isMetaPixelEnabled } from "@/lib/metaPixel";
import { absoluteUrl, siteConfig } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vocab Speak | English Vocabulary App for IELTS, GRE, SAT & BCS",
    template: "%s | Vocab Speak",
  },
  description: siteConfig.description,
  keywords: [
    "English vocabulary app",
    "IELTS vocabulary",
    "GRE vocabulary",
    "SAT vocabulary",
    "BCS vocabulary",
    "Admission vocabulary",
    "spoken English practice",
    "flashcard app",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  applicationName: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  manifest: "/manifest.json",
  verification: {
    google: "Mv_Y3_ab6WmVZafQhyZzUAA6VWVqsHJuIy4sRxhlPCc",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "Vocab Speak | English Vocabulary App for IELTS, GRE, SAT & BCS",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "Vocab Speak",
    type: "website",
    locale: siteConfig.locale,
    images: [
      {
        url: absoluteUrl(siteConfig.defaultImage),
        width: 1200,
        height: 630,
        alt: "Vocab Speak - English vocabulary learning app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vocab Speak | English Vocabulary App for IELTS, GRE, SAT & BCS",
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.defaultImage)],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const metaPixelId = getMetaPixelId();
  const metaPixelEnabled = isMetaPixelEnabled();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="site-structured-data" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${siteConfig.url}/#organization`,
                name: siteConfig.name,
                url: siteConfig.url,
                logo: absoluteUrl(siteConfig.defaultImage),
                sameAs: [],
              },
              {
                "@type": "WebSite",
                "@id": `${siteConfig.url}/#website`,
                url: siteConfig.url,
                name: siteConfig.name,
                description: siteConfig.description,
                publisher: { "@id": `${siteConfig.url}/#organization` },
              },
            ],
          })}
        </Script>
        {metaPixelEnabled ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
        <Script id="register-service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function (error) {
                  console.warn('Service worker registration failed:', error);
                });
              });
            }
          `}
        </Script>
        <ErrorBoundary>
          <main className="flex-1">{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
