# Guía de Contribución

Este documento establece las reglas de desarrollo y colaboración del proyecto.

## 1. Flujo de trabajo con Git

El proyecto utiliza tres niveles de ramas:

```text
feature/HU-XX-nombre-corto
      │
      │ Pull Request
      ▼
   develop
      │
      │ Pull Request
      ▼
     main
````

* **`main`**: contiene únicamente código estable.
* **`develop`**: rama de integración y revisión del equipo.
* **`feature/HU-XX-nombre-corto`**: rama de trabajo asociada a una Historia de Usuario (HU) específica.

No se permiten cambios directos sobre `main` ni `develop`.
Cada Historia de Usuario se trabaja en su propia rama; si más de un integrante participa en la misma HU, ambos trabajan sobre esa misma rama.

---

## 2. Inicio y sincronización

Antes de comenzar a trabajar o crear un Pull Request, la rama de la HU debe estar actualizada con `develop`:

```bash
git checkout develop
git pull origin develop
git checkout feature/HU-XX-nombre-corto
git merge develop
```

Los conflictos deben resolverse antes de crear o actualizar el Pull Request.

---

## 3. User Stories e Issues

Las User Stories están registradas como Issues en GitHub.
Cada Issue (HU) genera su propia rama independiente.

```text
User Story / Issue
        ↓
Rama feature/HU-XX-nombre-corto
        ↓
Commits
        ↓
Pull Request
        ↓
develop
```

Cada Pull Request debe indicar la User Story o Issue correspondiente.

---

## 4. Convención de commits

Se utiliza Conventional Commits:

```text
tipo(ámbito): descripción
```

Ejemplos:

```text
feat(cart): add product to cart
fix(auth): validate user credentials
test(products): add product tests
docs(readme): update installation guide
refactor(users): simplify user service
chore(deps): update dependencies
```

Tipos permitidos:

| Tipo       | Uso                           |
| ---------- | ----------------------------- |
| `feat`     | Nueva funcionalidad           |
| `fix`      | Corrección de errores         |
| `test`     | Pruebas                       |
| `docs`     | Documentación                 |
| `refactor` | Refactorización               |
| `chore`    | Mantenimiento o configuración |
| `style`    | Formato o estilo              |

Los commits deben ser claros, concretos y relacionados con un cambio específico.

Evitar mensajes como:

```text
cambios
arreglos
final
final2
prueba
```

---

## 5. Reglas de desarrollo

### Código general

* Utilizar TypeScript en frontend y backend.
* Utilizar nombres descriptivos.
* Mantener funciones y componentes con responsabilidades claras.
* Evitar duplicación innecesaria.
* No dejar código muerto.
* No incluir credenciales o información sensible.


### Frontend

```text
app/          → páginas y rutas
components/   → componentes reutilizables
features/     → funcionalidades
services/     → comunicación con backend
hooks/        → hooks personalizados
types/        → tipos de TypeScript
utils/        → funciones auxiliares
```

### Backend

Mantener separación de responsabilidades:

```text
Controller → Service → Repository → Database
```

La lógica de negocio debe permanecer en los Services y el acceso a la base de datos debe realizarse mediante Prisma.

### Base de datos

Los cambios en PostgreSQL deben realizarse mediante migraciones de Prisma.

---

## 6. Variables de entorno

Nunca subir:

```text
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

Las credenciales, tokens y API keys deben permanecer fuera del repositorio.

`.env.example` debe contener únicamente las variables necesarias, sin valores sensibles.

---

## 7. Pull Requests

Todo cambio hacia `develop` debe realizarse mediante Pull Request:

```text
feature/HU-XX-nombre-corto → develop
```

Una vez que `develop` sea estable:

```text
develop → main
```

No se permiten PR directos desde ramas de HU hacia `main`.

Cada PR debe incluir:

* Descripción del cambio.
* User Story / Issue relacionada.
* Cambios realizados.
* Pruebas realizadas.
* Consideraciones importantes, si aplica.

La plantilla se encuentra en:

```text
.github/pull_request_template.md
```

---

## 8. Revisión y Definition of Done

Antes de aprobar un Pull Request se debe verificar:

* [ ] La User Story cumple sus criterios de aceptación.
* [ ] El código funciona correctamente.
* [ ] Las pruebas correspondientes fueron realizadas.
* [ ] El lint no presenta errores.
* [ ] El proyecto compila correctamente.
* [ ] No contiene información sensible.
* [ ] La documentación fue actualizada si era necesario.
* [ ] El Pull Request fue revisado y aprobado.

Si se solicitan cambios, deben realizarse en la misma rama y actualizar el Pull Request.

---

## 9. Verificación antes del Pull Request

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
cd backend
npm run lint
npm run build
npm run test
```

---

## 10. Flujo resumido

```text
1. Seleccionar User Story
        ↓
2. Crear o retomar rama feature/HU-XX-nombre-corto
        ↓
3. Desarrollar y hacer commits
        ↓
4. Ejecutar pruebas y validaciones
        ↓
5. Crear Pull Request
        ↓
6. Code Review
        ↓
7. Merge → develop
        ↓
8. Validar develop
        ↓
9. Pull Request → main
        ↓
10. Merge → main
```