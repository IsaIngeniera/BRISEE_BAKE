# Pruebas de Integración QA — Backend

- Levantan la aplicación NestJS **real** (`AppModule` completo).
- Se conectan a Postgres **real** (BD `brisee_bake_test`).
- Usan **bcrypt real** para hashear contraseñas.
- Usan **JwtService real** para firmar y verificar tokens.
- Aplican el **ValidationPipe** global igual que en producción.

Solo se mockean los servicios **externos** al sistema:
- `fetch` para la API de Wompi.
- `nodemailer.createTransport` para el envío de correos.

Esto permite validar que las piezas trabajan juntas: controller + service + Prisma + Postgres.

## 🗺️ Mapeo HU → archivos de prueba

| HU | Funcionalidad | Archivo |
|----|---------------|---------|
| **HU-13** | Registro de nuevo usuario | `auth/registro.integration.qa-spec.ts` |
| **HU-15** | Inicio de sesión tradicional | `auth/login.integration.qa-spec.ts` |
| **HU-19** | Ingreso de datos de entrega | `pedidos/crear-pedido.integration.qa-spec.ts` |
| **HU-20** | URL de pasarela de pagos (Wompi) | `pedidos/crear-pedido.integration.qa-spec.ts` |
| **HU-25** | Registro de la orden (atomicidad) | `pedidos/crear-pedido.integration.qa-spec.ts` |
| **HU-21** | Confirmación de pago exitoso | `pedidos/verificar-pago.integration.qa-spec.ts` |
| **HU-22** | Manejo de pago rechazado | `pedidos/verificar-pago.integration.qa-spec.ts` |
| **HU-24** | Notificación de nueva orden | `pedidos/verificar-pago.integration.qa-spec.ts` |
| **HU-26** | Historial de pedidos | `pedidos/historial.integration.qa-spec.ts` |

Las HUs **HU-17, HU-18, HU-23 y HU-27** no requieren pruebas de integración segun nuestra estrategia.

## 🏗️ Estructura

```
test/qa-integration/
├── README.md                 ← Este archivo
├── jest.config.js            ← Config separada de las unitarias
├── globalSetup.ts            ← Carga .env.test y aplica migraciones
├── helpers/
│   ├── test-app.ts           ← Construye la app NestJS para tests
│   ├── test-db.ts            ← Limpia tablas entre tests
│   ├── test-fixtures.ts      ← Factories (usuarios, productos, fechas)
│   └── assert-test-db.ts     ← Guard: valida que DATABASE_URL sea de pruebas
├── auth/
│   ├── registro.integration.qa-spec.ts
│   └── login.integration.qa-spec.ts
└── pedidos/
    ├── crear-pedido.integration.qa-spec.ts
    ├── verificar-pago.integration.qa-spec.ts
    └── historial.integration.qa-spec.ts
```

## ⚙️ Setup (una sola vez por máquina)

### 1. Postgres corriendo

```bash
cd /ruta/al/proyecto/BRISEE_BAKE
docker-compose up postgres -d
```

Verificar que está sano:

```bash
docker ps --filter name=brisee-bake-postgres --format "{{.Names}} {{.Status}}"
```

### 2. Crear la BD de pruebas

```bash
docker exec brisee-bake-postgres psql -U brisee -d brisee_bake \
  -c "CREATE DATABASE brisee_bake_test;"
```

### 3. Configurar variables de entorno

```bash
cp backend/.env.test.example backend/.env.test
```

El `globalSetup.ts` carga automáticamente este archivo antes de los tests. **Importante:** el `DATABASE_URL` debe tener `_test` en el nombre; de lo contrario el setup rechaza correr (protección contra ejecutar migraciones destructivas sobre la BD de dev).

## ▶️ Ejecución

### Correr todas las pruebas de integración

```bash
cd backend
npm run test:integration
```

### Correr un archivo específico

```bash
cd backend
npm run test:integration -- --testPathPatterns=registro
npm run test:integration -- --testPathPatterns=crear-pedido
```

### Correr solo tests que coincidan con un nombre

```bash
cd backend
npm run test:integration -- -t "HU-19"
```


