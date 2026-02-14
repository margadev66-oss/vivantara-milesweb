const { Prisma, PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

const PRISMA_CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

function isPrismaConnectionError(error) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_CONNECTION_ERROR_CODES.has(error.code);
  }

  if (error instanceof Error) {
    return /can't reach database server|connection|timed out|ECONNREFUSED/i.test(error.message);
  }

  return false;
}

async function withPrismaFallback(query, fallback, scope) {
  try {
    return await query();
  } catch (error) {
    if (!isPrismaConnectionError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[prisma-fallback] ${scope}: ${message}`);
    return fallback;
  }
}

module.exports = { prisma, withPrismaFallback };

