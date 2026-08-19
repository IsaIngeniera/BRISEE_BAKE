FROM node:24.14.1-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY backend ./backend

WORKDIR /app/backend

EXPOSE 3001

CMD ["npm", "run", "start:dev"]]
