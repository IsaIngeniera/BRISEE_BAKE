# BRISÉE BAKE

## Introducción


## Descripción

Este repositorio contiene el desarrollo de la aplicación web de la reposteria Brisee Bake.

El proyecto utiliza una arquitectura de monorepo, donde el frontend y el backend se encuentran dentro del mismo repositorio, manteniendo responsabilidades y estructuras independientes.

## Tecnologías

- **Frontend:** Next.js + TypeScript
- **Backend:** Node.js + NestJS + TypeScript
- **Base de datos:** PostgreSQL
- **ORM:** Prisma
- **Contenedores:** Docker + Docker Compose
- **Control de versiones:** Git + GitHub
- **Integración continua:** GitHub Actions

## Estructura del repositorio

```text
proyecto/
│
├── .github/                              # Configuración y automatizaciones de GitHub
│   ├── workflows/                        # Flujos automáticos de integración y validación
│   │   └── ci.yml                        # Validaciones automáticas en Pull Requests
│   │
│   └── pull_request_template.md          # Plantilla para estandarizar Pull Requests
│
├── frontend/                             # Aplicación web desarrollada con Next.js
│   ├── src/                              # Código fuente principal del frontend
│   │   └── app/                          # Páginas, rutas y layouts de Next.js (App Router)
│   ├── public/                           # Imágenes, iconos y recursos estáticos
│   ├── eslint.config.mjs                 # Configuración de ESLint
│   ├── next.config.ts                    # Configuración de Next.js
│   ├── tsconfig.json                     # Configuración de TypeScript
│   ├── package.json                      # Dependencias y scripts del frontend
│   └── Dockerfile                        # Imagen Docker del frontend
│
├── backend/                              # API y lógica del servidor con NestJS
│   ├── src/                              # Código fuente principal del backend
│   │   ├── app.module.ts                 # Módulo raíz de la aplicación
│   │   ├── app.controller.ts             # Controlador principal
│   │   ├── app.service.ts                # Servicio principal
│   │   └── main.ts                       # Punto de entrada de la aplicación NestJS
│   │
│   ├── prisma/                           # Configuración y gestión de la base de datos
│   │   ├── schema.prisma                 # Modelo de datos y configuración de Prisma
│   │   ├── migrations/                   # Historial de cambios de la base de datos
│   │   │   ├── 20260815012956_initial/   # Migración inicial
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml       # Control de migraciones de Prisma
│   │   │
│   │   └── generated/                    # Cliente Prisma generado
│   │       └── prisma/                   # Código generado automáticamente
│   │
│   ├── test/                             # Pruebas del backend
│   ├── prisma.config.ts                  # Configuración de Prisma
│   ├── nest-cli.json                     # Configuración del CLI de NestJS
│   ├── eslint.config.mjs                 # Configuración de ESLint
│   ├── tsconfig.json                     # Configuración de TypeScript
│   ├── package.json                      # Dependencias y scripts del backend
│   └── Dockerfile                        # Imagen Docker del backend
│
├── docs/                                 # Documentación técnica del proyecto
│   ├── architecture/                     # Diagramas y decisiones arquitectónicas
│   ├── api/                              # Documentación de endpoints y contratos de la API
│   ├── database/                         # Documentación del modelo y estructura de la base de datos
│   └── TECH_STACK.md                     # Versiones oficiales del stack tecnológico
│
├── .env.example                          # Ejemplo de las variables de entorno necesarias
├── .gitignore                            # Archivos y carpetas que Git debe ignorar
├── .dockerignore                         # Archivos excluidos de las imágenes Docker
├── .nvmrc                                # Versión de Node.js utilizada por el proyecto
├── docker-compose.yml                    # Orquestación de servicios con Docker
├── setup.ps1                             # Script de configuración del entorno (Windows)
├── CONTRIBUTING.md                       # Reglas y flujo de contribución
├── README.md                             # Documentación principal del proyecto
├── package.json                          # Configuración de workspaces y scripts del monorepo
└── package-lock.json                     # Versiones exactas de las dependencias
```

## Requisitos del entorno

Para ejecutar el proyecto localmente se requiere:

* Git
* Node.js `24.14.1`
* npm `11.11.0`
* PostgreSQL **o** Docker

La versión de Node.js utilizada por el proyecto está especificada en `.nvmrc`.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/IsaIngeniera/BRISEE_BAKE.git
cd BRISEE_BAKE
```

### 2. Instalar dependencias

Desde la raíz del monorepo. Gracias a los npm workspaces, esto instala las dependencias del frontend y del backend automáticamente:

```bash
npm install
```

### 3. Configurar variables de entorno

Crear el archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes al entorno local.

### 4. Ejecutar el proyecto

#### Opción A — Con Docker (recomendado)

Levanta PostgreSQL, el backend y el frontend de forma automática:

```bash
docker-compose up
```

#### Opción B — Sin Docker

Primero levantar una instancia local de PostgreSQL y configurar `DATABASE_URL` en `.env`.

Luego aplicar las migraciones de la base de datos:

```bash
cd backend
npx prisma generate --config prisma.config.ts
npx prisma migrate deploy --config prisma.config.ts
```

`prisma.config.ts` carga `DATABASE_URL` desde el `.env` de la raíz del
repositorio. Para ejecutar una migración sin archivo `.env`, se puede pasar la
variable explícitamente:

```bash
cd ..
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/brisee_bake" \
  npx prisma migrate deploy --config backend/prisma.config.ts
```

Iniciar el backend:

```bash
npm run start:dev --workspace=backend
```

Iniciar el frontend (en otra terminal):

```bash
npm run dev --workspace=frontend
```

Los servicios estarán disponibles en:

* Frontend: `http://localhost:3000`
* Backend: `http://localhost:3001`

### Requisitos para producción

En producción, el backend valida al arrancar que estén configuradas las
variables `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ORIGINS`,
`WOMPI_ENV`, `WOMPI_API_URL`, `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`,
`WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`, `RESEND_API_KEY` y
`ADMIN_EMAIL`. Deben inyectarse desde el gestor de secretos del proveedor de
despliegue; no deben escribirse en Git.

El endpoint `/health/live` comprueba que el proceso está activo y
`/health/ready` comprueba además la conexión con PostgreSQL. El despliegue debe
usar `/health/ready` como readiness probe y ejecutar las migraciones con:

```bash
NODE_ENV=production npm run start:prod --workspace=backend
```

Wompi debe apuntar al endpoint público `POST /pedidos/webhook-wompi`. El
webhook valida `WOMPI_EVENTS_SECRET`, el monto y la moneda antes de actualizar
el pedido. El retorno del navegador se conserva únicamente como experiencia de
usuario; la confirmación operativa debe provenir del webhook.

## Pruebas automatizadas

Desde la raíz del repositorio:

```bash
npm test --workspace=frontend
npm run test --workspace=backend
npm run test:integration --workspace=backend
npm test --prefix e2e
```

Las pruebas de integración y E2E requieren PostgreSQL. El workflow de
GitHub Actions crea una base efímera, genera Prisma Client, aplica las
migraciones y luego ejecuta Playwright. No se deben usar credenciales reales
en los archivos de entorno de pruebas ni en el repositorio.

## Flujo de desarrollo

Cada desarrollador trabaja en su propia rama personal:

```text
dev/<nombre>
```

Los cambios se integran mediante Pull Requests hacia `develop`.

Cuando `develop` contiene una versión estable, se realiza un Pull Request hacia `main`.

```text
dev/<nombre_del_desarrollador>
      │
      │ Pull Request
      ▼
   develop
      │
      │ Pull Request
      ▼
     main
```

No se permiten cambios directos sobre `main` ni `develop`.

## Contribución

Las reglas de desarrollo, convenciones de commits, flujo de ramas, Pull Requests y revisión de código se encuentran en:

[CONTRIBUTING.md](./CONTRIBUTING.md)

## Documentación

La documentación técnica adicional se encuentra en la carpeta `docs/`.

* `docs/architecture/`: arquitectura y decisiones técnicas.
* `docs/api/`: documentación de la API.
* `docs/database/`: documentación de la base de datos.

## Estado del proyecto

En desarrollo.