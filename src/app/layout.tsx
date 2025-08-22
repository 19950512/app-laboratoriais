import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { AccountProvider } from '@/contexts/AccountContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { ToastProvider } from '../components/ui/Toast';
import '@/styles/globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sistema Laboratorial',
  description: 'Sistema de gestão laboratorial multitenant',
  keywords: ['laboratório', 'gestão', 'saúde', 'exames'],
  authors: [{ name: 'Sistema Laboratorial' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Sistema Laboratorial',
    description: 'Sistema de gestão laboratorial multitenant',
    type: 'website',
    locale: 'pt_BR',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <ToastProvider>
            <AccountProvider>
              <BusinessProvider>
                <div className="min-h-screen bg-background text-foreground">
                  {children}
                </div>
              </BusinessProvider>
            </AccountProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
