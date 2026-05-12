import './globals.css';
import React from 'react';

export const metadata = {
  title: 'ATS Resume Analyzer',
  description: 'Analisa e corrige currículos para sistemas ATS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
