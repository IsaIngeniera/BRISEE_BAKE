# Comparativo entre `develop` y `seguridad/mejoras-seguridad`

## Alcance

Este documento describe las diferencias de la rama
`seguridad/mejoras-seguridad` respecto a `develop`, tomando como referencia:

```bash
git diff develop...seguridad/mejoras-seguridad
```

La comparación corresponde a cuatro commits adicionales en la rama actual:

| Commit | Descripción |
|---|---|
| `5e728dc` | Mejoras de seguridad en la autenticación del administrador |
| `6589f1e` | Mejoras generales de preparación y robustez |
| `da135d3` | Refuerzo del checkout y mensajería de contacto |
| `53fb456` | Validación de roles actuales y actualización de pruebas |

En total, la rama contiene diferencias en 64 archivos frente a `develop`.

## Resumen ejecutivo

Los cambios de esta rama convierten varios flujos que dependían únicamente del
frontend o de datos manipulables en el navegador en flujos validados por el
backend. Las áreas principales son:

- endurecimiento de autenticación, autorización y configuración de producción;
- health checks y mejoras de ejecución con Docker;
- validación de inventario y precios durante el checkout;
- persistencia del carrito al regresar de Wompi;
- actualización confiable del estado de pagos;
- formulario de contacto conectado a un proveedor de correo;
- administración de productos y protección del historial de pedidos;
- pruebas unitarias, de integración y E2E actualizadas.

## Cambios por área

### 1. Autenticación, autorización y roles

#### Cambios

- Se reforzó la validación del secreto JWT y de las variables obligatorias del
  entorno.
- El `JwtAuthGuard` ya no confía únicamente en el rol almacenado dentro del
  JWT. Consulta el usuario actual en la base de datos en cada solicitud
  protegida.
- Las cuentas inexistentes, inactivas o bloqueadas pierden el acceso a rutas
  protegidas.
- Se agregó `GET /auth/session` para validar la sesión y devolver el rol actual.
- El layout de administración valida la sesión al cargar y reacciona a cambios
  de autenticación.
- Si un usuario inició sesión como administrador y luego se le cambia el rol a
  cliente, deja de poder operar en administración sin tener que confiar en el
  token antiguo.
- Se mantuvo la validación de teléfono para aceptar únicamente números.
- Se agregaron controles de rate limiting y utilidades para obtener el secreto
  JWT de forma centralizada.

#### Motivo

Antes, cambiar el rol en la base de datos no invalidaba un JWT que todavía
contenía `rol: ADMIN`. Esto permitía que una sesión ya abierta siguiera
mostrando y usando la administración. La consulta del estado actual evita esa
escalada de privilegios por sesión antigua y también protege las rutas de
mutación del backend.

Archivos relevantes:

- [`backend/src/common/guards/jwt-auth.guard.ts`](../backend/src/common/guards/jwt-auth.guard.ts)
- [`backend/src/auth/auth.controller.ts`](../backend/src/auth/auth.controller.ts)
- [`backend/src/auth/auth.service.ts`](../backend/src/auth/auth.service.ts)
- [`frontend/src/app/admin/layout.tsx`](../frontend/src/app/admin/layout.tsx)
- [`frontend/src/services/auth.ts`](../frontend/src/services/auth.ts)
- [`backend/src/common/guards/rate-limit.guard.ts`](../backend/src/common/guards/rate-limit.guard.ts)
- [`backend/src/common/security/jwt-secret.ts`](../backend/src/common/security/jwt-secret.ts)

### 2. Preparación para producción y Docker

#### Cambios

- Se agregaron los endpoints `/health/live` y `/health/ready`.
- Docker Compose usa el health check de readiness del backend antes de iniciar
  el frontend.
- Se corrigieron las rutas de ejecución de NestJS y Next.js standalone.
- Se corrigió la instalación de dependencias runtime y la generación de
  Prisma Client dentro de la imagen del backend.
- Se forzó el puerto `3000` del frontend para evitar que heredara por error el
  puerto del backend desde `.env`.
- Se documentaron variables de producción, webhook de Wompi y verificaciones
  de salud.
- Se actualizaron plantillas de entorno y configuración de CI.

#### Motivo

Los contenedores fallaban al iniciar por rutas de salida compiladas
incorrectas, dependencias runtime ausentes y una generación incompleta de
Prisma Client. Además, un health check correcto evita que un servicio
dependiente arranque contra un backend todavía no disponible.

Archivos relevantes:

- [`docker-compose.yml`](../docker-compose.yml)
- [`backend/Dockerfile`](../backend/Dockerfile)
- [`frontend/Dockerfile`](../frontend/Dockerfile)
- [`backend/src/main.ts`](../backend/src/main.ts)
- [`backend/src/app.controller.ts`](../backend/src/app.controller.ts)
- [`README.md`](../README.md)
- [`.env.example`](../.env.example)
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

### 3. Checkout, carrito, inventario y precios

#### Cambios

- El carrito conserva las existencias conocidas de cada producto.
- Al cargar o actualizar el carrito, el frontend sincroniza nombre, precio,
  imagen y existencias con el catálogo.
- Se bloquean cantidades no enteras, menores que uno o superiores al inventario.
- El control de continuar la compra deja de ser un botón accionable cuando hay
  cantidades inválidas; por tanto, no puede abrir el panel de entrega por un
  clic forzado.
- El backend vuelve a consultar los productos antes de crear el pedido.
- El backend calcula el total con precios de la base de datos y no con valores
  almacenados en `localStorage`.
- El DTO de pedido exige cantidades enteras y positivas.
- Se conservan los productos del carrito al regresar de Wompi.
- Se corrigió el cambio de origen `localtest.me` a `localhost`, que hacía que
  el navegador usara otro `localStorage`.

#### Motivo

El usuario podía modificar manualmente el número de unidades en el navegador,
superar las existencias y continuar hasta obtener totales incorrectos. La
validación duplicada en frontend y backend evita manipulación de cantidades y
precios. La sincronización con el catálogo también permite detectar cambios de
inventario antes de crear el pedido.

El carrito se conserva al volver de Wompi porque el pago no debe destruir el
estado de compra del cliente ni provocar una pérdida aparente por cambio de
dominio local.

Archivos relevantes:

- [`frontend/src/context/CartContext.tsx`](../frontend/src/context/CartContext.tsx)
- [`frontend/src/app/carrito/page.tsx`](../frontend/src/app/carrito/page.tsx)
- [`frontend/src/components/cart/CartItemRow.tsx`](../frontend/src/components/cart/CartItemRow.tsx)
- [`frontend/src/components/products/QuantitySelector.tsx`](../frontend/src/components/products/QuantitySelector.tsx)
- [`frontend/src/components/products/AddToCartButton.tsx`](../frontend/src/components/products/AddToCartButton.tsx)
- [`backend/src/pedidos/pedidos.service.ts`](../backend/src/pedidos/pedidos.service.ts)
- [`backend/src/pedidos/dto/create-pedido.dto.ts`](../backend/src/pedidos/dto/create-pedido.dto.ts)
- [`frontend/src/components/layout/CanonicalHostRedirect.tsx`](../frontend/src/components/layout/CanonicalHostRedirect.tsx)

### 4. Pagos Wompi e historial de pedidos

#### Cambios

- Se agregó el webhook `POST /pedidos/webhook-wompi`.
- El webhook valida firma, monto y moneda antes de actualizar el pago en
  producción.
- La verificación de transacciones actualiza el estado de `Pago`.
- El historial del cliente muestra el estado del pago además del estado de
  entrega.
- El frontend actualiza el historial local después de un pago aprobado o no
  aprobado.
- Se agregaron validaciones explícitas cuando faltan claves de Wompi o
  configuración necesaria de correo.

#### Motivo

Crear el pedido como `PENDIENTE` no era suficiente: el resultado de Wompi debía
reflejarse de forma consistente en la base de datos y en “Mis pedidos”.
También era necesario evitar que un webhook no autenticado pudiera modificar
estados de pago o montos.

Archivos relevantes:

- [`backend/src/pedidos/pedidos.controller.ts`](../backend/src/pedidos/pedidos.controller.ts)
- [`backend/src/pedidos/pedidos.service.ts`](../backend/src/pedidos/pedidos.service.ts)
- [`frontend/src/app/finalizar-compra/page.tsx`](../frontend/src/app/finalizar-compra/page.tsx)
- [`frontend/src/app/cuenta/pedidos/page.tsx`](../frontend/src/app/cuenta/pedidos/page.tsx)

### 5. Formulario de contacto y correo

#### Cambios

- Se creó el módulo de contacto del backend.
- Se agregó `POST /contacto` con DTO y validaciones.
- Los mensajes se envían a `ADMIN_EMAIL`.
- Se soporta Resend y, como alternativa local, SMTP de Gmail.
- El correo del visitante se usa como `replyTo`.
- Se escapa el contenido HTML antes de construir el correo.
- El frontend muestra estados de envío, confirmación y error.

#### Motivo

El formulario mostraba una interacción de frontend, pero no existía un flujo
completo y explícito para entregar el mensaje al administrador. El nuevo
módulo centraliza el envío, valida la entrada y evita insertar contenido
proporcionado por el usuario como HTML sin escapar.

Archivos relevantes:

- [`backend/src/contacto/contacto.module.ts`](../backend/src/contacto/contacto.module.ts)
- [`backend/src/contacto/contacto.controller.ts`](../backend/src/contacto/contacto.controller.ts)
- [`backend/src/contacto/contacto.dto.ts`](../backend/src/contacto/contacto.dto.ts)
- [`backend/src/contacto/contacto.service.ts`](../backend/src/contacto/contacto.service.ts)
- [`frontend/src/app/contacto/page.tsx`](../frontend/src/app/contacto/page.tsx)

### 6. Administración de productos

#### Cambios

- Los productos `INACTIVO` siguen visibles en la administración para poder
  revisarlos o reactivarlos.
- El botón de eliminación envía correctamente el JWT como `Bearer`.
- El backend diferencia entre:
  - cambiar un producto a `INACTIVO`;
  - eliminarlo definitivamente.
- La eliminación definitiva limpia imágenes y referencias del carrito.
- Un producto que pertenece a pedidos no se elimina para proteger el historial;
  debe marcarse como `INACTIVO`.
- Los errores devueltos por el backend se muestran al administrador.

#### Motivo

El listado administrativo filtraba los inactivos y hacía parecer que habían
desaparecido. Además, el botón de eliminación enviaba una autorización
incorrecta y el backend solo realizaba un soft delete, lo que permitía repetir
la acción indefinidamente. La separación entre inactivar y eliminar hace el
comportamiento predecible y conserva la integridad histórica de los pedidos.

Archivos relevantes:

- [`frontend/src/app/admin/productos/page.tsx`](../frontend/src/app/admin/productos/page.tsx)
- [`frontend/src/components/products/DeleteProductButton.tsx`](../frontend/src/components/products/DeleteProductButton.tsx)
- [`backend/src/products/products.service.ts`](../backend/src/products/products.service.ts)
- [`backend/src/products/products.controller.ts`](../backend/src/products/products.controller.ts)

### 7. Catálogo y frontend

#### Cambios

- Se ajustaron páginas de categorías y detalles para mantener el flujo de
  catálogo y administración coherente.
- Se aplicaron correcciones de imágenes, configuración de Next.js y lint.
- Se conectaron las nuevas validaciones de autenticación y carrito a los
  componentes existentes.

#### Motivo

Los cambios de backend debían reflejarse en todas las superficies que
consumen productos, autenticación y checkout, evitando que una vista aplicara
reglas distintas a otra.

### 8. Pruebas y calidad

#### Cambios

- Se actualizaron mocks de Prisma y del guard de autenticación.
- Se ajustaron pruebas de fechas de entrega y transacciones de pedidos.
- Las pruebas E2E ahora:
  - verifican que el carrito se conserve después de Wompi;
  - simulan el endpoint de contacto sin depender de Gmail real.
- Se actualizaron pruebas de eliminación de productos y autorización.

#### Validación realizada

| Suite | Resultado |
|---|---:|
| Backend unitarias | 217/217 |
| Frontend unitarias | 197/197 |
| Backend integración | 45/45 |
| E2E Playwright | 42/42 |

#### Motivo

Las pruebas antiguas contenían expectativas que ya no correspondían al
comportamiento acordado, especialmente la expectativa de borrar el carrito al
volver de Wompi. También había pruebas que dependían de credenciales externas
de Gmail. Los mocks y las expectativas se actualizaron para validar el
comportamiento real sin depender de servicios externos.

Archivos relevantes:

- [`backend/test/qa-unit/pedidos/pedidos.service.qa-spec.ts`](../backend/test/qa-unit/pedidos/pedidos.service.qa-spec.ts)
- [`backend/test/qa-unit/products/products.controller.qa-spec.ts`](../backend/test/qa-unit/products/products.controller.qa-spec.ts)
- [`backend/test/qa-unit/products/products.service.qa-spec.ts`](../backend/test/qa-unit/products/products.service.qa-spec.ts)
- [`e2e/tests/checkout/pago-aprobado.spec.ts`](../e2e/tests/checkout/pago-aprobado.spec.ts)
- [`e2e/tests/contacto/contacto.spec.ts`](../e2e/tests/contacto/contacto.spec.ts)

## Compatibilidad y consideraciones

- La rama no modifica ni incluye el archivo local `.env`.
- Las claves de Wompi, Google, SMTP y JWT usadas durante pruebas deben
  regenerarse antes de producción si fueron compartidas.
- Los productos usados en pedidos no deben eliminarse físicamente; deben
  marcarse como `INACTIVO`.
- El archivo `docs/GUIA-PRUEBAS-MANUALES.md` existe localmente, pero no forma
  parte de esta comparación ni de los commits realizados.

## Conclusión

`seguridad/mejoras-seguridad` amplía `develop` con endurecimiento de seguridad,
correcciones de despliegue, protección de inventario y precios, integración
operativa de contacto y pagos, administración más consistente y una suite de
pruebas alineada con el comportamiento actual. La rama fue validada con las
cuatro capas de pruebas indicadas y quedó publicada en el remoto.
