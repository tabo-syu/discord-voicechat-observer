import { PrismaClient, Guild as GuildRecord } from '.prisma/client';
import { Guild } from 'discord.js';

export default class GuildTable {
  guild;

  constructor(prisma: PrismaClient) {
    this.guild = prisma.guild;
  }

  async initialize(
    guild: Guild,
    users: { id: string }[]
  ): Promise<GuildRecord> {
    const record = await this.guild.create({
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
