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
          padding: '40px 30px',
          backgroundColor: '#fcebf2',
          borderRadius: '24px',
          border: '1px solid rgb(214 96 152 / 8%)',
          boxShadow: '0 12px 30px rgb(123 75 93 / 10%)',
        }}
      >
        <h1
          style={{
            margin: '0 0 30px',
            color: '#d66098',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2.1rem, 4vw, 2.8rem)',
            fontWeight: 400,
            textAlign: 'center',
            lineHeight: 1.1,
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