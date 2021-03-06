import { PrismaClient } from '.prisma/client';
import { Guild, VoiceState } from 'discord.js';

import { StateRecord } from '../types';

export default class VoiceChannelTable {
  voiceChannel;

  constructor(prisma: PrismaClient) {
    this.voiceChannel = prisma.voiceChannel;
  }

  async initialize(guild: Guild): Promise<
    {
      id: string;
      guildId: string;
    }[]
  > {
    const voiceChannels = guild.channels.cache
      .filter((channel) => channel.type === 'voice')
      .map((channel) => ({
        id: channel.id,
        guildId: guild.id,
      }));

    await this.voiceChannel.createMany({
      data: voiceChannels,
      skipDuplicates: true,
    });

    console.log('init VoiceChannel Table', voiceChannels);
    return voiceChannels;
  }

  async findByGuild(guildId: string): Promise<StateRecord[]> {
    const voiceChannels = await this.voiceChannel.findMany({
      where: {
        guildId: guildId,
      },
      include: {
        Participants: true,
      },
    });

    return voiceChannels;
  }

  async updateVoiceChannels(state: VoiceState): Promise<StateRecord[]> {
    const channelsState = state.guild.channels.cache
      .filter((channel) => channel.type === 'voice')
      .map((channel) => {
        const members = channel.members.map((member) => ({
          id: member.user.id,
        }));

        return {
          id: channel.id,
          members: members,
        };
      });

    const result = channelsState.map(async (channelState) => {
      return await this.voiceChannel.update({
        where: {
          id: channelState.id,
        },
        data: {
          updatedAt: new Date(),
          Participants: {
            set: channelState.members,
          },
        },
        include: {
          Participants: true,
        },
      });
    });

    return await Promise.all(result);
  }
}
