import type { Metadata } from 'next';
import { Space_Grotesk, Unbounded } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import MobileBottomNav from '@/components/MobileBottomNav';

const bodyFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-body' });
const brandFont = Unbounded({ subsets: ['latin'], variable: '--font-brand' });

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'Create AI-powered question papers for your students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${brandFont.variable} ${bodyFont.className} antialiased`}>
        {children}
        <MobileBottomNav />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
