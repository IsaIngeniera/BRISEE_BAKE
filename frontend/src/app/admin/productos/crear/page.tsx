import React, { Suspense } from 'react';
import ProductFormModal from '../../../../components/products/ProductFormModal';

export default function CrearProductoPage() {
  return (
    <div style={{ backgroundColor: '#fcebf2', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#000', marginBottom: '20px', textAlign: 'center' }}>Crear Nuevo Producto</h1>
        <Suspense fallback={<div>Cargando formulario...</div>}>
          <ProductFormModal />
        </Suspense>
      </div>
    </div>
  );
}
