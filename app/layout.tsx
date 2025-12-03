import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

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
    default: "Sajilokhel — Book Futsal Venues & Courts in Nepal",
    template: "%s | Sajilokhel",
  },
  description:
    "Book futsal venues and indoor courts across Nepal with Sajilokhel — real-time availability, secure payments, instant confirmation, and easy online booking for players and venue owners.",
  keywords: ["futsal", "booking", "football", "sports", "ground", "nepal", "kathmandu", "sajilokhel"],
  authors: [{ name: "Sajilokhel Team" }],
  creator: "Sajilokhel",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/logo_no_bg.png", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/logo_no_bg.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sajilokhel.com",
    title: "Sajilokhel — Book Futsal Venues & Courts in Nepal",
    description:
      "Book futsal venues and indoor courts across Nepal with real-time availability, secure payments, and instant confirmations on Sajilokhel.",
    siteName: "Sajilokhel",
    images: [
      {
        url: "/openGraphImage.png",
        width: 1200,
        height: 630,
        alt: "Sajilokhel - Venue Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sajilokhel — Book Futsal Venues & Courts in Nepal",
    description:
      "Book futsal venues and indoor courts across Nepal with Sajilokhel — real-time availability, secure payments, and instant confirmations.",
    images: ["/openGraphImage.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Script id="structured-data" strategy="afterInteractive">
          {`{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Sajilokhel",
            "url": "https://sajilokhel.com",
            "logo": "https://sajilokhel.com/logo_no_bg.png",
            "sameAs": [
              "https://www.facebook.com/sajilokhel",
              "https://www.instagram.com/sajilokhel"
            ],
            "contactPoint": [{
              "@type": "ContactPoint",
              "telephone": "+977-1-0000000",
              "contactType": "customer support",
              "areaServed": "NP",
              "availableLanguage": "English"
            }]
          }`}
        </Script>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
