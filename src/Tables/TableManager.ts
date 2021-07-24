import { PrismaClient, VoiceChannel, User } from '.prisma/client';
import { Guild, GuildMember, VoiceState } from 'discord.js';

import GuildTable from './GuildTable';
import SessionTable from './SessionTable';
import UserTable from './UserTable';
import VoiceChannelTable from './VoiceChannelTable';

export default class TableManager {
  prisma: PrismaClient;
  guild: GuildTable;
  session: SessionTable;
  user: UserTable;
  voiceChannel: VoiceChannelTable;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    this.guild = new GuildTable(this.prisma);
    this.session = new SessionTable(this.prisma);
    this.user = new UserTable(this.prisma);
    this.voiceChannel = new VoiceChannelTable(this.prisma);
  }

  async initialize(guild: Guild): Promise<void> {
    await this.prisma.$connect();

    const users = await this.user.initialize(guild);
    await this.guild.initialize(guild, users);
    await this.voiceChannel.initialize(guild);

    console.log('initialized');

    await this.prisma.$disconnect();
  }

  async addGuildParticipant(member: GuildMember): Promise<void> {
    if (member.user.bot) {
      return;
    }
    await this.prisma.$connect();

    await this.user.upsert(member);

    await this.prisma.$disconnect();
  }

  async updateVoiceChannels(
    guildId: string,
    voiceState: VoiceState
  ): Promise<(VoiceChannel & { Participants: User[] })[][]> {
    await this.prisma.$connect();

    const oldChannelState = await this.voiceChannel.findByGuild(guildId);
    const newChannelsState = await this.voiceChannel.updateVoiceChannels(
      voiceState
    );

    await this.prisma.$disconnect();

    return [oldChannelState, newChannelsState];
  }
}
