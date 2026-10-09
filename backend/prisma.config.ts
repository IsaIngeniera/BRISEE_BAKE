import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(__dirname, "../.env") });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});