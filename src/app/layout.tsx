import type { Metadata } from 'next';
import { PT_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-provider';
import { AuthProviderClient } from '@/components/auth-provider-client';
import { cn } from '@/lib/utils';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Fit Planner',
  description: 'La plataforma definitiva para coaches y centros fitness.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
        { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
        { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("font-body antialiased", ptSans.variable, poppins.variable)}>
        <AuthProvider>
          <AuthProviderClient>
            <ThemeProvider>
              {children}
            </ThemeProvider>
            <Toaster />
          </AuthProviderClient>
        </AuthProvider>
      </body>
    </html>
  );
}
