import { PrismaClient, Guild as GuildRecord } from '.prisma/client';
import { Guild } from 'discord.js';

export default class GuildTable {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async initialize(
    guild: Guild,
    users: { id: string }[]
  ): Promise<GuildRecord> {
    const record = await this.prisma.guild.create({
      data: {
        id: guild.id,
        Participants: {
          connect: users,
        },
      },
    });

    console.log('init Guild Table', record);
    return record;
  }
}
