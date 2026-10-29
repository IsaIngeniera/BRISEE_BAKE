FROM node:24.14.1-bookworm AS build

WORKDIR /app

COPY package.json package-lock.json ./

COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY frontend ./frontend

WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace=frontend

FROM node:24.14.1-bookworm AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/frontend/public ./public
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
