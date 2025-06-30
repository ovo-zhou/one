import { PrismaClient } from "@prisma/client";

const prismaClient = (() => {
  let prisma: PrismaClient | null = null;

  return () => {
    if (!prisma) {
      prisma = new PrismaClient();
    }
    return prisma;
  };
})();

export default prismaClient();