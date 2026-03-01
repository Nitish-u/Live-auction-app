import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";

import logger from "./logger";

const url = process.env.DATABASE_URL;

if (!url) {
    throw new Error("DATABASE_URL must be defined");
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);

const logConfig: (Prisma.LogDefinition | Prisma.LogLevel)[] = process.env.NODE_ENV === "production"
    ? ["warn", "error"]
    : ["query", "info", "warn", "error"];

const prisma = new PrismaClient({
    adapter,
    log: logConfig
});

// @ts-ignore - Prisma types for $on can be tricky with extended clients or adapters
if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    prisma.$on("query", (e: any) => {
        logger.debug(`DB Query`, { query: e.query, params: e.params, duration: `${e.duration}ms` });
    });
}
// @ts-ignore
prisma.$on("error", (e: any) => {
    logger.error(`DB Error`, { message: e.message, target: e.target });
});

export default prisma;
