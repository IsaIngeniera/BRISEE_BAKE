FROM node:24.14.1-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY backend ./backend

WORKDIR /app/backend
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brisee_db" npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
