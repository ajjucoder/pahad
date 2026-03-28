import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/providers/auth-provider';
import { LanguageProvider } from '@/providers/language-provider';
import { ServiceWorkerRegistration, InstallPrompt } from '@/components/shared';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5B7553' },
    { media: '(prefers-color-scheme: dark)', color: '#3D5235' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Pahad - Community Mental Health Screening',
    template: '%s | Pahad',
  },
  description:
    'A mobile decision-support tool for community health workers in Nepal to log early behavioral warning signs and flag households that may need mental health support.',
  keywords: [
    'mental health',
    'community health',
    'Nepal',
    'screening',
    'healthcare',
    'CHW',
    'decision support',
  ],
  authors: [{ name: 'Pahad Team' }],
  creator: 'Pahad',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ne_NP'],
    title: 'Pahad - Community Mental Health Screening',
    description:
      'A mobile decision-support tool for community health workers in Nepal to identify early warning signs and connect households with care.',
    siteName: 'Pahad',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pahad - Community Mental Health Screening',
    description:
      'A mobile decision-support tool for community health workers in Nepal to identify early warning signs and connect households with care.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pahad',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-full flex flex-col bg-background">
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  },
                }}
              />
              <ServiceWorkerRegistration />
              <InstallPrompt />
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
