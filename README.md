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
│   │   ├── app/                          # Páginas, rutas y layouts de Next.js
│   │   ├── components/                   # Componentes visuales reutilizables
│   │   ├── features/                     # Funcionalidades específicas del sistema
│   │   ├── services/                     # Comunicación con la API del backend
│   │   ├── hooks/                        # Hooks personalizados de React
│   │   ├── types/                        # Tipos e interfaces de TypeScript
│   │   └── utils/                        # Funciones auxiliares reutilizables
│   │
│   ├── public/                           # Imágenes, iconos y recursos estáticos
│   ├── tests/                            # Pruebas del frontend
│   ├── package.json                      # Dependencias y scripts del frontend
│   ├── tsconfig.json                     # Configuración de TypeScript
│   └── next.config.ts                    # Configuración de Next.js
│
├── backend/                              # API y lógica del servidor con NestJS
│   ├── src/                              # Código fuente principal del backend
│   │   ├── modules/                      # Módulos correspondientes a funcionalidades del sistema
│   │   ├── common/                       # Elementos compartidos entre diferentes módulos
│   │   ├── config/                       # Configuraciones de la aplicación
│   │   └── main.ts                       # Punto de entrada de la aplicación NestJS
│   │
│   ├── prisma/                           # Configuración y gestión de la base de datos
│   │   ├── schema.prisma                 # Modelo de datos y configuración de Prisma
│   │   └── migrations/                   # Historial de cambios de la base de datos
│   │
│   ├── test/                             # Pruebas del backend
│   ├── package.json                      # Dependencias y scripts del backend
│   └── tsconfig.json                     # Configuración de TypeScript
│
├── docs/                                 # Documentación técnica del proyecto
│   ├── architecture/                     # Diagramas y decisiones arquitectónicas
│   ├── api/                              # Documentación de endpoints y contratos de la API
│   └── database/                         # Documentación del modelo y estructura de la base de datos
│
├── .env.example                          # Ejemplo de las variables de entorno necesarias
├── .gitignore                            # Archivos y carpetas que Git debe ignorar
├── .nvmrc                                # Versión de Node.js utilizada por el proyecto
├── CONTRIBUTING.md                       # Reglas y flujo de contribución
├── README.md                             # Documentación principal del proyecto
└── package.json                          # Configuración y scripts generales del monorepo
````

## Requisitos del entorno

Para ejecutar el proyecto localmente se requiere:

* Git
* Node.js
* npm
* PostgreSQL

La versión de Node.js utilizada por el proyecto está especificada en `.nvmrc`.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/IsaIngeniera/BRISEE_BAKE.git
cd BRISEE_BAKE
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear los archivos `.env` necesarios a partir de `.env.example`.

### 4. Configurar PostgreSQL

Crear una base de datos PostgreSQL local y configurar la variable `DATABASE_URL` correspondiente.

### 5. Ejecutar el proyecto

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run start:dev
```

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