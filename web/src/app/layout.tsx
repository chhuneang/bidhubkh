import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer", "latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "BidHubKH — Cambodian Tender Intelligence & Official Procurement Platform",
    template: "%s | BidHubKH",
  },
  description:
    "Consolidated official procurement opportunities across Cambodian Government Ministries (MEF/GDPP, MPWT), World Bank, Asian Development Bank, UNGM, and NGOs. AI-assisted tender summaries, BoQ extraction, and supplier qualification.",
  keywords: [
    "Cambodia Tenders",
    "Cambodian Procurement",
    "World Bank Cambodia",
    "ADB Cambodia",
    "MEF GDPP Tenders",
    "Public Bidding Cambodia",
    "Cambodia RFP",
    "Supplier Matching",
  ],
  authors: [{ name: "BidHubKH Team" }],
  creator: "BidHubKH",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bidhubkh.com",
    title: "BidHubKH — Cambodian Tender Intelligence Platform",
    description:
      "Search, track, and win official Cambodian public procurement notices from Government Ministries, Multilateral Banks, and NGOs.",
    siteName: "BidHubKH",
  },
  twitter: {
    card: "summary_large_image",
    title: "BidHubKH — Cambodian Tender Intelligence Platform",
    description:
      "Aggregating 100% verified official procurement notices across Cambodia with AI tender intelligence.",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafc] text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:text-xs focus:font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
