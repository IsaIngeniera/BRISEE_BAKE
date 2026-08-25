import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-[#fff5f8] py-4 px-8 flex justify-between items-center shadow-sm sticky top-0 z-40">
      {/* Logo Text */}
      <div className="flex flex-col items-center text-[#d46a8d]">
        <h1 className="text-2xl font-serif tracking-widest leading-none">BRISÉE BAKE</h1>
        <span className="text-[10px] italic font-serif">Handmade with love</span>
      </div>

      {/* Links */}
      <div className="hidden md:flex gap-8 text-[#d46a8d] font-medium text-lg">
        <Link href="/" className="hover:text-pink-400 transition">Bienvenido</Link>
        <Link href="/" className="hover:text-pink-400 transition">Catálogo</Link>
        <Link href="/contactos" className="hover:text-pink-400 transition">Contactos</Link>
        <Link href="/analitica" className="hover:text-pink-400 transition">Analítica ▾</Link>
      </div>

      {/* Icons */}
      <div className="flex gap-4 text-[#d46a8d]">
        <button className="hover:scale-110 transition-transform"><ShoppingCart /></button>
        <button className="hover:scale-110 transition-transform"><User /></button>
      </div>
    </nav>
  );
}
