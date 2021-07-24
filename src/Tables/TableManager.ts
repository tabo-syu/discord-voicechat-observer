import { PrismaClient, VoiceChannel, User } from '.prisma/client';
import { Guild, GuildMember, VoiceState } from 'discord.js';

import GuildTable from './GuildTable';
import SessionTable from './SessionTable';
import UserTable from './UserTable';
import VoiceChannelTable from './VoiceChannelTable';
import SessionLogTable from './SessionLogTable';
import { StateRecord, SessionLogAction } from '../types';

export default class TableManager {
  prisma: PrismaClient;
  guild: GuildTable;
  session: SessionTable;
  sessionLog: SessionLogTable;
  user: UserTable;
  voiceChannel: VoiceChannelTable;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.guild = new GuildTable(this.prisma);
    this.session = new SessionTable(this.prisma);
    this.sessionLog = new SessionLogTable(this.prisma);
    this.user = new UserTable(this.prisma);
    this.voiceChannel = new VoiceChannelTable(this.prisma);
  }

  async initialize(guild: Guild): Promise<void> {
    const users = await this.user.initialize(guild);
    await this.guild.initialize(guild, users);
    await this.voiceChannel.initialize(guild);

    await this.prisma.$disconnect();

    console.log('initialized');
  }

  async addGuildParticipant(member: GuildMember): Promise<void> {
    if (member.user.bot) {
      return;
    }
    await this.user.upsert(member);
    await this.prisma.$disconnect();
  }

  async updateVoiceChannels(
    guildId: string,
    voiceState: VoiceState
  ): Promise<(VoiceChannel & { Participants: User[] })[][]> {
    const oldChannelState = await this.voiceChannel.findByGuild(guildId);
    const newChannelsState = await this.voiceChannel.updateVoiceChannels(
      voiceState
    );
    await this.prisma.$disconnect();

    return [oldChannelState, newChannelsState];
  }

  async startSession(state: StateRecord): Promise<void> {
    await this.session.start(state);
    await this.prisma.$disconnect();
  }

  async endSession(state: StateRecord): Promise<void> {
    await this.session.end(state);
    await this.prisma.$disconnect();
  }

  async addSessionLog(user: User, action: SessionLogAction): Promise<void> {
    const session = await this.session.findByVoiceChannelId(
      user.voiceChannelId
    );
    await this.sessionLog.insert(session, user, action);
    await this.prisma.$disconnect();
  }
}
