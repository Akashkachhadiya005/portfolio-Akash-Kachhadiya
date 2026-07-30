import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
  title: {
    default: "Akash Kachhadiya — AI/ML Engineer",
    template: "%s | Akash Kachhadiya",
  },
  description:
    "AI/ML Engineer building intelligent, cloud-native solutions. AWS Certified (×3). Turning data into real business impact with Python, AWS & Generative AI.",
  metadataBase: new URL("https://akashkachhadiya.vercel.app"),
  openGraph: {
    title: "Akash Kachhadiya — AI/ML Engineer",
    description:
      "AI/ML Engineer at Calyza Tech with 3 AWS certifications. Specializing in Machine Learning, Generative AI, and Data Science.",
    url: "https://akashkachhadiya.vercel.app",
    siteName: "Akash Kachhadiya",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akash Kachhadiya — AI/ML Engineer",
    description:
      "AI/ML Engineer building intelligent solutions with Python, AWS & Generative AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <JsonLd />
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
