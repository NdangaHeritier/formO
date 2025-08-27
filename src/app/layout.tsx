import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from 'next/font/google';
import "./globals.css";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/lib/Auth_context";
import { Icon } from "@/components/Global/Icon";

export const metadata: Metadata = {
  title: 'FormO — Effortless Form Submission and Email Handling',
  authors: [
    {
      name: 'Dev Ndanga',
      url: 'https://ndangaheritier.vercel.app',
    },
  ],
  creator: 'Ndanga Heritier',
  applicationName: 'Formo',
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
    siteName: 'Formo',
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
        <main className="dark">
          <section className="min-h-screen p-0">
            <AuthProvider>
              {children}
            </AuthProvider>
            <div className="fixed right-0 bottom-0 p-3 inline-block z-[9999]">
              <button type="button" className="bg-yellow-100 hover:bg-yellow-50 duration-500 cursor-pointer flex items-center justify-center p-3 text-yellow-800 rounded-full shadow-xl shadow-yellow-500 ring-4 ring-yellow-500/30">
                <Icon name="Bot" size={25} strokeWidth={2} />
              </button>
            </div>
          </section>
          <Footer />
        </main>
      </body>
    </html>
  );
}
