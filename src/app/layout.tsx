import type { Metadata } from "next";
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import "./globals.css";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { Icon } from "@/components/Global/Icon";
import ThemeSync from "@/components/Global/ThemeSync";
import { ToastProvider } from "@/components/Global/Toast";
import Tooltip from "@/components/Global/Tooltip";

export const metadata: Metadata = {
  title: 'FormO — Effortless Form Submission and Email Handling',
  authors: [
    {
      name: 'Dev Ndanga',
      url: 'https://ndanga.me',
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
    'FormO is a self-hosted form backend with durable email delivery, built with Next.js, Tailwind CSS and PostgreSQL.',
  keywords: [
    'FormO',
    'form backend',
    'email forms',
    'form submissions',
    'no-code email tool',
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

const generalSans = localFont({
  src: [
    {
      path: '../../public/Assets/Fonts/WEB/fonts/GeneralSans-Variable.woff2',
      weight: '200 700',
      style: 'normal',
    },
    {
      path: '../../public/Assets/Fonts/WEB/fonts/GeneralSans-VariableItalic.woff2',
      weight: '200 700',
      style: 'italic',
    },
  ],
  variable: '--font-general-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${generalSans.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Set the theme before first paint so there is no light/dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('formo-theme');var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeSync />
        <ToastProvider />
        <Analytics />
        <main>
          <section className="min-h-screen p-0">
            {children}
            <div className="fixed right-0 bottom-0 z-[9999] inline-block p-3">
              <Tooltip label="FormO assistant" placement="left">
                <button
                  type="button"
                  aria-label="FormO assistant"
                  className="flex cursor-pointer items-center justify-center rounded-full bg-yellow-100 p-3 text-yellow-800 transition-colors duration-200 hover:bg-yellow-50 shadow-lg dark:bg-yellow-600/20 dark:text-yellow-500 dark:hover:bg-yellow-600/30"
                >
                  <Icon name="Bot" size={25} strokeWidth={2} />
                </button>
              </Tooltip>
            </div>
          </section>
          <Footer />
        </main>
      </body>
    </html>
  );
}
