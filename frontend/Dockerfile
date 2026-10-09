FROM node:24.14.1-bookworm

WORKDIR /app

COPY package.json package-lock.json ./

COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY frontend ./frontend

WORKDIR /app/frontend

EXPOSE 3000

CMD ["npm", "run", "dev"]
