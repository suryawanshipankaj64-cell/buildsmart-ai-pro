import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600'] });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'BuildSmart AI Pro',
  description: 'AI-powered construction cost estimation and project planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-navy-950 text-paper`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
