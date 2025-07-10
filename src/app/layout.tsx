import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Weel',
  description: 'Open-source device control with advanced features.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground" style={{ fontFamily: 'Geist, Geist Mono, sans-serif' }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
