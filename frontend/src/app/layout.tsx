import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';
import {
  Libre_Baskerville,
  Chivo,
  Plus_Jakarta_Sans,
} from 'next/font/google';

import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import { CartProvider } from '../context/CartContext';

import './globals.css';

/* ── Fuentes de respaldo desde Google Fonts ─────────────────────
   Se inyectan como variables CSS y sirven de fallback cuando las
   fuentes institucionales (Baskerville Display PT, Antique Olive,
   Canva Sans) no están instaladas en el dispositivo del usuario.
─────────────────────────────────────────────────────────────── */
const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--gf-baskerville', // respaldo para Baskerville Display PT
  display: 'swap',
});

const chivo = Chivo({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--gf-chivo', // respaldo para Antique Olive
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--gf-jakarta', // respaldo para Canva Sans
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brisée Bake',
  description: 'Pastelería Brisée Bake',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  const fontClasses = [
    libreBaskerville.variable,
    chivo.variable,
    plusJakartaSans.variable,
  ].join(' ');

  return (
    <html lang="es" className={fontClasses}>
      <body>
        <CartProvider>
          <Header />

          <main>{children}</main>

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}