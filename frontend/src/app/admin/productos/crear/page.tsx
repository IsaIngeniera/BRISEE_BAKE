import { Suspense, type ReactElement } from 'react';

import ProductForm from '../../../../components/products/ProductForm';

export default function CreateProductPage(): ReactElement {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#fcebf2',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '30px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1
          style={{
            marginBottom: '20px',
            color: '#000000',
            fontFamily: 'Georgia, serif',
            textAlign: 'center',
          }}
        >
          Crear nuevo producto
        </h1>

        <Suspense
          fallback={<div>Cargando formulario...</div>}
        >
          <ProductForm />
        </Suspense>
      </div>
    </div>
  );
}