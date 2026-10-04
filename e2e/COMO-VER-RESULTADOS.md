# Cómo ver los resultados de las pruebas E2E

> Guía paso a paso para correr las pruebas end-to-end del Sprint 2 y analizar sus resultados.

---

## 📦 0. Pre-requisitos (solo la primera vez)

Antes de correr las pruebas por primera vez, verifica que el entorno esté listo:

### 0.1 Postgres corriendo
```bash
docker-compose up postgres -d
docker ps --filter name=brisee-bake-postgres --format "{{.Names}} {{.Status}}"
```

Esperado: `brisee-bake-postgres  Up X minutes (healthy)`

### 0.2 Crear la BD de E2E
```bash
docker exec brisee-bake-postgres psql -U brisee -d brisee_bake \
  -c "CREATE DATABASE brisee_bake_e2e;"
```

Si ya existe, aparece `ERROR: database "brisee_bake_e2e" already exists` → no pasa nada, seguí al siguiente paso.

### 0.3 Aplicar migraciones a la BD de E2E
```bash
cd backend
DATABASE_URL="postgresql://brisee:brisee_dev@localhost:5432/brisee_bake_e2e" \
  npx prisma migrate deploy
cd ..
```

Esperado: `All migrations have been successfully applied.`

### 0.4 Variables de entorno
```bash
test -f e2e/.env.e2e || cp e2e/.env.e2e.example e2e/.env.e2e
```

### 0.5 Instalar Playwright y Chromium
```bash
cd e2e
npm install
npx playwright install chromium
```

Chromium pesa ~95 MB, puede tardar un par de minutos.

---

## ▶️ 1. Correr toda la suite

```bash
cd e2e
npm test
```

### Qué vas a ver en la terminal

1. **Playwright carga variables de `.env.e2e`:**
   ```
   ◇ injected env (11) from .env.e2e
   ```

2. **Levanta backend NestJS (puerto 3011):**
   ```
   [WebServer] [Nest] LOG [NestFactory] Starting Nest application...
   [WebServer] [Nest] LOG [NestApplication] Nest application successfully started
   ```

3. **Levanta frontend Next.js (puerto 3010):**
   ```
   [WebServer] ▲ Next.js 16.3.1 (Turbopack)
   [WebServer] - Local:         http://localhost:3010
   [WebServer] ✓ Ready in 198ms
   ```

4. **Corre los tests, uno por uno:**
   ```
   Running 40 tests using 1 worker
   
     ✓  1 [chromium] › tests/auth/registro.spec.ts:31:7 › HU-13 ... (2.3s)
     ✓  2 [chromium] › tests/contacto/contacto.spec.ts:14:7 › HU-27 ... (0.8s)
     ✘  3 [chromium] › tests/checkout/datos-entrega.spec.ts:... (3.1s)
     ...
   ```

5. **Resumen final:**
   ```
     16 passed, 24 failed (3m 20s)
   
   To open last HTML report run:
     npx playwright show-report
   ```

### Convención de iconos
- ✓ test pasó
- ✘ test falló
- ⊘ test skipped

---

## 📊 2. Ver el reporte HTML (lo más visual)

Después de la corrida:

```bash
cd e2e
npm run report
```

Esto abre en tu navegador un reporte interactivo. Vas a ver:

- **Barra superior:** total de tests, pasados, fallidos, tiempo total.
- **Lista de tests** agrupados por archivo con ✅/❌ al lado.
- **Buscador y filtros** por estado (passed, failed, flaky).

### Al hacer clic en un test fallido ves:

| Elemento | Qué muestra |
|----------|-------------|
| **Timeline** | Cada acción (clic, fill, goto, expect) con su duración |
| **Screenshot** | Captura del navegador en el momento del fallo |
| **Video** | Reproducción completa de lo que hizo el navegador |
| **Trace** | Visor paso a paso con DOM, red, consola |
| **Error message** | El mensaje de error de Playwright |
| **Stack trace** | Líneas del código del test donde falló |

---

## 🔍 3. Investigar un test específico que falló

Para los tests que fallaron, Playwright guarda:

```
e2e/test-results/<nombre-del-test>/
├── trace.zip          ← Traza completa (abrir con show-trace)
├── video.webm         ← Video del navegador
├── test-failed-1.png  ← Screenshot del momento del fallo
└── error-context.md   ← Snapshot del DOM
```

### Opción A: abrir la traza interactiva (recomendado)

```bash
npx playwright show-trace e2e/test-results/<carpeta>/trace.zip
```

Esto abre una app con:
- **Línea de tiempo** de todas las acciones del test
- Al hacer clic en una acción: screenshot ANTES y DESPUÉS
- **Inspector del DOM** en cada momento
- **Pestaña Network:** todas las requests HTTP que hizo el test
- **Pestaña Console:** logs del navegador

### Opción B: ver solo el video

```bash
open e2e/test-results/<carpeta>/video.webm
```

### Opción C: ver solo la captura de pantalla

```bash
open e2e/test-results/<carpeta>/test-failed-1.png
```

---

## 🎯 4. Correr tests específicos

### Un archivo entero
```bash
npm test -- auth/registro.spec.ts
npm test -- checkout/pago-aprobado.spec.ts
```

### Un test por nombre
```bash
npm test -- -g "happy path"
npm test -- -g "HU-13"
```

### Toda una carpeta
```bash
npm test -- auth/
npm test -- checkout/
```

---

## 🖥️ 5. Modos de ejecución

### Modo UI (interactivo, lo más útil para debug)
```bash
npm run test:ui
```

Abre una interfaz donde podés:
- Correr tests uno por uno
- Ver el navegador en vivo
- Hacer pausa en cualquier paso
- Modificar el test y re-correrlo sin salir

### Modo headed (navegador visible)
```bash
npm run test:headed
```

Corre normal pero con el navegador visible — útil para ver el flujo en tiempo real.

### Modo debug (paso a paso con pausa)
```bash
npm run test:debug
```

Abre el inspector de Playwright, pausa en cada acción y permite inspeccionar.

---

## 📈 6. Interpretar los resultados

### Lo que pasa normalmente en este proyecto

Al correr la suite completa esperamos ver algo como:

```
Tests:       40 total
  ✓ passed:  16   ← HU-13, HU-15, HU-17, HU-18, HU-27 (todo lo que no toca pedidos)
  ✘ failed:  24   ← HU-19, HU-21, HU-22, HU-25, HU-26 (todo lo que crea/lee pedidos)
```

### Por qué fallan 24 tests (no es un error de los tests)

Las pruebas de integración ya detectaron el **BUG-001:**

- `schema.prisma` declara el campo `fechaEsperada` en el modelo `Pedido`.
- Las migraciones aplicadas **no incluyen esa columna**.
- Por lo tanto, cualquier `prisma.pedido.create()` falla con:
  ```
  The column `fechaEsperada` of relation `pedidos` does not exist
  ```

Esto se refleja en los tests E2E así:

| HU | Comportamiento esperado | Lo que pasa realmente |
|----|------------------------|----------------------|
| HU-19 | Confirmar el pedido abre /finalizar-compra | El backend devuelve 500 → el frontend muestra el error en el carrito |
| HU-21 | "¡Pago exitoso!" tras pagar | Nunca llegamos al pago porque la creación del pedido falla |
| HU-22 | "Pago no procesado" tras rechazo | Igual, nunca llegamos al pago |
| HU-25 | Pedido queda en BD + redirige a Wompi | Backend 500 |
| HU-26 | Cliente ve sus pedidos | Backend 500 en GET /pedidos/mis-pedidos |

**Las pruebas están correctamente escritas. Los fallos son el bug.**

---

## 🧹 7. Limpiar entre corridas (opcional)

Los artefactos de corridas pasadas quedan en `e2e/test-results/`. Para arrancar limpio:

```bash
cd e2e
rm -rf test-results playwright-report
```

Nota: `playwright-report/` se regenera cada vez que corras `npm test`. No hace falta limpiar.

---

## 🎬 Flujo típico para demo / grabación

Si querés grabar un video mostrando los resultados:

1. Abrir una terminal, corre `cd e2e && rm -rf test-results playwright-report`
2. Correr `npm test` (toma ~3 min, dejá la grabación corriendo)
3. Mientras corre, podés hablar sobre la cantidad de tests, el porqué de los fallos, etc.
4. Al finalizar, correr `npm run report` → se abre el reporte HTML
5. Hacer clic en un test que **pasó** (por ejemplo HU-13 registro) → mostrar la traza
6. Hacer clic en un test que **falló** (por ejemplo HU-25 crear pedido) → mostrar:
   - El mensaje de error (500 Internal Server Error)
   - El video (se ve el modal, el clic en "Confirmar", el error del backend)
   - La pestaña Network (ver el POST /pedidos devolviendo 500)
7. Explicar: "Este 500 es el mismo bug que las pruebas de integración detectaron: la columna `fechaEsperada` no existe en la BD."

---

## ⚠️ Troubleshooting

### "Port 3010 is already in use" / "Port 3011 is already in use"

Hay algo corriendo en esos puertos. Soluciones:
```bash
# Ver qué los está usando
lsof -i :3010 -i :3011

# Si es un proceso tuyo, matarlo
kill <PID>
```

### "Cannot find module '@prisma/client'"

El cliente de Prisma no está generado. Ejecutar:
```bash
cd backend && npx prisma generate && cd ..
```

### Timeouts al cargar páginas (`page.goto timed out`)

Next.js dev con Turbopack compila on-demand. Si es la primera vez, puede tardar. Si siempre pasa, aumentar en `playwright.config.ts`:
```ts
navigationTimeout: 90_000,  // de 60 a 90 segundos
```

### "database 'brisee_bake_e2e' does not exist"

Faltó el paso 0.2 del setup. Ejecutá:
```bash
docker exec brisee-bake-postgres psql -U brisee -d brisee_bake \
  -c "CREATE DATABASE brisee_bake_e2e;"
```

Y luego aplicá las migraciones (paso 0.3).

### Playwright se congela en "webServer timed out"

El backend o frontend están tardando mucho en arrancar. Esperá hasta 3 minutos la primera vez (Nest + Prisma pueden ser lentos). Si pasó más, matar y reintentar:
```bash
pkill -f "nest start" ; pkill -f "next dev"
```
