import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Ahmed Bouramdane | Software Developer",
  description: "The portfolio of Ahmed Bouramdane, a software developer building web applications and exploring AI, data, and interactive experiences.",
  alternates: siteUrl ? { canonical: siteUrl } : undefined,
  openGraph: {
    title: "Ahmed Bouramdane | Software Developer",
    description: "Explore web applications, AI, data analysis, and interactive projects by Ahmed Bouramdane.",
    type: "website",
    locale: "en_US",
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: "Ahmed Bouramdane",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ahmed Bouramdane | Software Developer",
    description: "Web development, AI, data analysis, and interactive projects by Ahmed Bouramdane.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
