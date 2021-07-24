import { PrismaClient } from '.prisma/client';

export default class SessionTable {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
}
