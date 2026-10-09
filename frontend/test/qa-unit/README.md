# Pruebas Unitarias QA - Frontend

Esta carpeta contiene las pruebas unitarias implementadas por el QA(Samuel Correa) para asegurar la calidad del frontend (Next.js + React + TypeScript).

## Estructura

```
frontend/test/qa-unit/
├── __mocks__/
│   └── fileMock.js              # Mock para imports de imágenes
├── jest.setup.ts                # Setup global (mocks de next/image, next/link)
├── utils/                       # Tests de utilidades puras
│   ├── normalize-text.qa-spec.ts
│   ├── product-variants.qa-spec.ts
│   └── order-history.qa-spec.ts
├── services/                    # Tests de servicios
│   └── auth.qa-spec.ts
├── context/                     # Tests de context providers
│   └── CartContext.qa-spec.tsx
├── components/                  # Tests de componentes React
│   ├── ExpandableDescription.qa-spec.tsx
│   ├── QuantitySelector.qa-spec.tsx
│   ├── DietaryFilterChips.qa-spec.tsx
│   └── ProductSearchBar.qa-spec.tsx
├── README.md                    # Este archivo
```

## Convenciones

- Archivos de prueba usan el sufijo `.qa-spec.ts` o `.qa-spec.tsx`
- Framework: **Jest 30 + React Testing Library + jsdom**
- Mocks automáticos de `next/image`, `next/link`, `localStorage`, `sessionStorage`
- Cada test se ejecuta en un entorno limpio (localStorage y sessionStorage se vacían)

## Ejecución

```bash
cd frontend

# Todos los tests
npm test

# Watch mode (durante desarrollo)
npm run test:watch

# Con reporte de coverage
npm run test:coverage

# Un módulo específico
npx jest test/qa-unit/utils
npx jest test/qa-unit/services
npx jest test/qa-unit/context
npx jest test/qa-unit/components
```