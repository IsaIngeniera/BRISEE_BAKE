# Guía de Comandos y Configuraciones - Brisée Bake

Este archivo documenta todos los comandos utilizados, dependencias instaladas y las diferentes formas de levantar el proyecto. Esto te servirá como referencia para el futuro.

## 📦 Descargas e Instalaciones Realizadas

Durante nuestra sesión, instalamos las siguientes dependencias en la carpeta `frontend/`:
- **`lucide-react`**: Librería ligera de íconos (usada para la cámara, usuarios, carrito, etc.).
- **`tailwindcss`**, **`postcss`**, **`autoprefixer`**: Herramientas principales para usar Tailwind CSS.
- **`@tailwindcss/postcss`**: El plugin necesario para hacer funcionar la versión 4 de Tailwind.

## 🚀 Cómo correr el proyecto

Existen dos formas principales de correr tu proyecto: por separado (ideal para desarrollo intensivo) o todo junto (ideal para pruebas y producción).

### Opción A: Todo por separado (Recomendado para desarrollo)

Si quieres ver los logs en vivo en tus terminales y tener el control absoluto de cada parte:

1. **Base de Datos (PostgreSQL)**
   Abre una terminal en la raíz (`BriseeBake`) y corre:
   ```bash
   docker-compose up -d postgres
   ```
   *(Esto levanta solo el contenedor de la base de datos).*

2. **Backend (NestJS)**
   Abre una nueva terminal, entra a la carpeta del backend y córrelo:
   ```bash
   cd backend
   npm run start:dev
   ```
   *Estará disponible en: `http://localhost:3001`*

3. **Prisma Studio (Ver Base de Datos Visualmente)**
   Abre una nueva terminal en el backend:
   ```bash
   cd backend
   npx prisma studio
   ```
   *Estará disponible en: `http://localhost:5555`*

4. **Frontend (Next.js)**
   Abre una nueva terminal en el frontend y córrelo:
   ```bash
   cd frontend
   npm run dev
   ```
   *Estará disponible en: `http://localhost:3000`*

---

### Opción B: Todo junto con Docker (Recomendado para pruebas rápidas)

Si no quieres abrir 4 terminales distintas y solo quieres ver la página funcionando:

1. Asegúrate de no tener servidores corriendo en tus terminales.
2. Abre una terminal en la raíz del proyecto (`BriseeBake`) y corre:
   ```bash
   docker-compose up --build -d
   ```
   *Esto construirá y levantará la BD, el Backend y el Frontend al mismo tiempo en segundo plano.*

3. Para **detener y apagar** todo el proyecto de golpe, ejecuta:
   ```bash
   docker-compose down
   ```

## 🛠️ Comandos de Solución de Problemas (Troubleshooting)

Durante el desarrollo nos topamos con un par de problemas técnicos. Estos son los comandos que usamos para arreglarlos:

**1. Matar "Procesos Fantasmas" en Windows**
Si al intentar correr el backend te dice que el puerto `3001` (o `3000`) ya está en uso, pero no tienes ninguna terminal abierta, significa que un proceso fantasma se quedó atrapado.
- Para buscar quién usa el puerto 3001:
  ```cmd
  netstat -ano | findstr :3001
  ```
  *(El último número a la derecha es el PID del proceso)*
- Para matar ese proceso forzosamente (reemplaza `1234` con el PID):
  ```cmd
  taskkill /F /PID 1234
  ```

**2. Refrescar Prisma cuando modificas el esquema**
Si modificas el archivo `schema.prisma` (como cuando añadimos las Etiquetas Dietéticas) debes correr estos comandos en `backend/` para actualizar la base de datos y tu código:
```bash
npx prisma db push
npx prisma generate
```

**3. Reiniciar solo un contenedor en Docker**
Si la base de datos u otro contenedor se queda sin conexión, puedes reiniciarlo sin bajar todo el proyecto:
```bash
docker-compose restart postgres
```

**4. Ver y editar la base de datos visualmente (Prisma Studio)**
Para abrir la interfaz gráfica de tu base de datos y ver todos tus productos creados en tiempo real:
1. Abre una nueva terminal.
2. Entra a la carpeta del backend: `cd backend`
3. Ejecuta Prisma Studio:
```bash
npx prisma studio
```
Esto abrirá una pestaña en tu navegador en `http://localhost:5555` donde podrás explorar todas tus tablas (Productos, Categorías, Usuarios, etc).
