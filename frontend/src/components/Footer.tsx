import { Phone, MapPin, Mail, Camera, Users, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#ffebf0] text-[#d46a8d] pt-10 pb-4 mt-20 border-t border-pink-200">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Logo Section */}
        <div className="flex justify-center md:justify-start items-center">
          <div className="w-40 h-40 relative rounded-full overflow-hidden bg-pink-100/50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-serif font-bold">BRISÉE</h2>
              <p className="text-xs italic">Handmade with love</p>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-xl font-bold mb-4 font-serif">Contacto</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3"><Phone size={18} /> +57 300 3685556</li>
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-1" />
              <span>Tv. 34D Sur #32D-52, Zona 9, Medellín,<br/>Envigado, Antioquia</span>
            </li>
            <li className="flex items-center gap-3"><Mail size={18} /> briseebake@gmail.com</li>
          </ul>
        </div>

        {/* Horario */}
        <div>
          <h3 className="text-xl font-bold mb-4 font-serif">Horario de atención</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between w-48"><span>Lunes</span><span>8:00 AM - 4:00 PM</span></li>
            <li className="flex justify-between w-48"><span>Miércoles</span><span>8:00 AM - 4:00 PM</span></li>
            <li className="flex justify-between w-48"><span>Jueves</span><span>8:00 AM - 4:00 PM</span></li>
            <li className="flex justify-between w-48"><span>Viernes</span><span>8:00 AM - 4:00 PM</span></li>
            <li className="flex justify-between w-48"><span>Sábados</span><span>8:00 AM - 12:00 PM</span></li>
          </ul>
        </div>

        {/* Mapa */}
        <div className="relative h-40 w-full rounded-lg overflow-hidden border border-pink-200">
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
            [Mapa Imagen: /images/map-placeholder.jpg]
          </div>
        </div>

      </div>

      {/* Social & Copyright */}
      <div className="bg-[#ffdae4] py-3 px-8 flex justify-between items-center rounded-t-xl mx-4">
        <div className="flex gap-4">
          <Camera size={20} className="cursor-pointer hover:text-pink-600" />
          <Users size={20} className="cursor-pointer hover:text-pink-600" />
          <MessageCircle size={20} className="cursor-pointer hover:text-pink-600" />
          <span className="font-bold cursor-pointer hover:text-pink-600">TikTok</span>
        </div>
        <p className="font-serif text-lg">Copyright©2026</p>
        <button className="bg-white rounded-full p-1 text-pink-400 hover:bg-pink-50">+</button>
      </div>
    </footer>
  );
}
