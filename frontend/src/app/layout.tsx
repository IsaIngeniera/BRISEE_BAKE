import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

import './globals.css';

export const metadata: Metadata = {
  title: 'Brisée Bake',
  description: 'Pastelería Brisée Bake',
  icons: {
    icon: '/icon.jpg',
  },
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="es">
      <body>
        <Header />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}