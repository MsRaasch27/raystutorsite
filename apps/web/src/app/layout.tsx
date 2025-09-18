import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";

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
    default: "Ray Raasch - TEFL Certified English Language Tutor | Personalized Learning",
    template: "%s | Ray Raasch - English Language Tutor"
  },
  description: "Transform your English learning journey with Ray Raasch, a TEFL-certified tutor with over a decade of experience. Personalized, gamified English language learning designed to help you achieve your language goals fast.",
  keywords: [
    "English tutor",
    "TEFL certified",
    "language learning",
    "English lessons",
    "personalized tutoring",
    "online English classes",
    "English conversation practice",
    "language skills development",
    "Ray Raasch",
    "English teacher",
    "one-on-one tutoring",
    "flexible scheduling"
  ],
  authors: [{ name: "Ray Raasch" }],
  creator: "Ray Raasch",
  publisher: "Ray Raasch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://raystutorsite.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Ray Raasch - TEFL Certified English Language Tutor',
    description: 'Transform your English learning journey with personalized, gamified tutoring designed to help you achieve your language goals fast.',
    siteName: 'Ray Raasch - English Language Tutor',
    images: [
      {
        url: '/TEFLclass.jpg',
        width: 1200,
        height: 630,
        alt: 'Ray Raasch teaching English in a TEFL classroom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ray Raasch - TEFL Certified English Language Tutor',
    description: 'Transform your English learning journey with personalized, gamified tutoring designed to help you achieve your language goals fast.',
    images: ['/TEFLclass.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
