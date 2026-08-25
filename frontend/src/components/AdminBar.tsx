export default function AdminBar() {
  return (
    <div className="bg-[#ff9cda] text-white text-xs font-bold py-1 px-4 flex justify-between items-center z-50 relative">
      <button className="bg-white/30 hover:bg-white/50 rounded-full w-6 h-6 flex items-center justify-center">+</button>
      <span className="tracking-widest">BRISÉE BAKE ADMIN</span>
      <div className="flex gap-2">
        <button className="border border-white/50 px-3 py-1 rounded hover:bg-white/20 transition">Vista Previa</button>
        <button className="border border-white/50 px-3 py-1 rounded hover:bg-white/20 transition">Guardar Cambios</button>
      </div>
    </div>
  );
}
