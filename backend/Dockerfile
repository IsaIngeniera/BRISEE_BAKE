FROM node:24.14.1-bookworm AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY backend ./backend

RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npm run build --workspace=backend

FROM node:24.14.1-bookworm AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/prisma.config.ts ./backend/prisma.config.ts
RUN npm ci --omit=dev
RUN npx prisma generate --schema backend/prisma/schema.prisma

COPY --from=build /app/backend/dist ./backend/dist

EXPOSE 3001

CMD ["npm", "run", "start:prod", "--workspace=backend"]
