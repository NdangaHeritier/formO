import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from 'next/font/google';
import "./globals.css";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: 'FormO — Effortless Form Submission and Email Handling',
  authors: [
    {
      name: 'Dev Ndanga',
      url: 'https://ndangaheritier.vercel.app',
    },
  ],
  creator: 'Ndanga Heritier',
  applicationName: 'FormO',
  icons: [
    { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/favicon-96x96.png' },
    { rel: 'icon', type: 'image/svg+xml', url: '/favicon.png' },
    { rel: 'shortcut icon', url: '/favicon.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' },
    { rel: 'manifest', url: '/site.webmanifest' },
  ],
  description:
    'FormO lets developers and non-developers collect form data and send styled emails with ease. Built with Next.js, Tailwind CSS, and PocketBase.',
  keywords: [
    'FormO',
    'form backend',
    'email forms',
    'form submissions',
    'no-code email tool',
    'PocketBase',
    'Next.js',
    'NodeMailer',
    'form to email',
  ],
  openGraph: {
    title: 'FormO — Effortless Form Submission and Email Handling',
    description:
      'Collect form data and send beautiful emails instantly. Whether you’re a dev or not, FormO makes it simple.',
    url: 'https://withformo.vercel.app',
    siteName: 'FormO',
    images: [
      {
        url: '/Twitter-card.png', 
        width: 1200,
        height: 630,
        alt: 'FormO – Simplified Form Submission',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormO — Send Emails from Forms with Ease',
    description: 'Build forms, send emails, and track data effortlessly.',
    images: ['/Twitter-card.png'], // <-- Use your local image
    creator: '@ndanga_dev',
  },
  metadataBase: new URL('https://withformo.vercel.app'),
  other: {
    'apple-mobile-web-app-title': 'Formo',
  },
};

const geistSans = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});
const geistMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased dark:bg-black`}
      >   
        <Analytics />
        <div className="min-md:hidden p-8">
            <header className="flex items-center justify-start gap-2 font-semibold text-lg text-zinc-800 dark:text-zinc-200">
              <Image src="/Assets/formo-coloured.png" alt="FormO Logo" className="h-10 w-auto" height={60} width={60}/>
            </header>
            <div className="flex flex-col items-center justify-center p-8 py-20 text-center">
              <h2 className="text-2xl font-bold mb-4">Device Not Supported</h2>
              <p className="text-base text-gray-500">
                Sorry, FormO is not compatible with small devices. Please use a tablet or desktop for the best experience.
              </p>
            </div>
        </div>
        <main className="max-md:hidden">
          <section className="min-h-screen p-0 pb-20">
            {children}
          </section>
          <Footer />
        </main>
      </body>
    </html>
  );
}
