import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TuringTapeHeader } from '@/components/layout/TuringTapeHeader';

export const metadata: Metadata = {
  title: 'TURING LAB — Passaporte de Investigação',
  description: 'Experiência imersiva sobre Alan Turing, Inteligência Artificial, Ética e Futuro.',
  keywords: ['Alan Turing', 'Inteligência Artificial', 'Feira Escolar', 'Turing Test', 'Ética na IA'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0d12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-archive-900 text-archive-paper bg-military-grid flex flex-col min-h-screen">
        <TuringTapeHeader />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
