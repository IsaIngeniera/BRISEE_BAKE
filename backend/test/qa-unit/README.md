# Pruebas Unitarias QA

Esta carpeta contiene las pruebas unitarias implementadas por el QA(Samuel Correa) para asegurar la calidad y correcto funcionamiento del backend.

## Estructura

```
test/qa-unit/
├── auth/            # Pruebas de autenticación
├── products/        # Pruebas del módulo de productos
├── carrito/         # Pruebas del carrito de compras
├── pedidos/         # Pruebas de pedidos y pagos
├── usuarios/        # Pruebas de gestión de usuarios
└── README.md        # Este archivo
```

## Convenciones

- Los archivos de prueba QA usan el sufijo `.qa-spec.ts` para distinguirlos de las pruebas de los desarrolladores (`.spec.ts`)
- Cada archivo cubre:
  - Casos exitosos (happy path)
  - Casos de error
  - Validaciones de datos
  - Edge cases
  - Mocks de dependencias externas

## Ejecución

### Ejecutar solo los tests de QA
```bash
cd backend
npx jest test/qa-unit
```

### Ejecutar todos los tests (desarrolladores + QA)
```bash
cd backend
npm test
```

### Ejecutar con coverage
```bash
cd backend
npx jest test/qa-unit --coverage
```

### Ejecutar un archivo específico
```bash
cd backend
npx jest test/qa-unit/auth/auth.service.qa-spec.ts
```
