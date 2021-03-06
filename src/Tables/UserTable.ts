import { PrismaClient, User } from '@prisma/client';
import { Guild, GuildMember } from 'discord.js';

export default class UserTable {
  user;

  constructor(prisma: PrismaClient) {
    this.user = prisma.user;
  }

  async initialize(guild: Guild): Promise<{ id: string }[]> {
    const members = await guild.members.fetch();
    const users = members
      .filter((member) => member.user.bot === false)
      .map((member) => ({ id: member.user.id }));

    await this.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    console.log('init User Table', users);

    return users;
  }

  async upsert(member: GuildMember): Promise<User> {
    const userId = member.user.id;
    const user = await this.user.upsert({
      where: {
        id: userId,
      },
      update: {
        Guilds: {
          connect: { id: member.guild.id },
        },
      },
      create: {
        id: userId,
        Guilds: {
          connect: { id: member.guild.id },
        },
      },
    });

    console.log('add User', user);
    return user;
  }
}
