import type { Metadata } from "next";
import "./globals.css";
import AdminBar from "../components/AdminBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Brisée Bake",
  description: "Handmade with love",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-[#fffcfd] text-gray-800 antialiased min-h-screen flex flex-col">
        <AdminBar />
        <Navbar />
        {/* El contenido específico de cada página irá aquí dentro */}
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
