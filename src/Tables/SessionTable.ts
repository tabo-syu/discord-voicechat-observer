import { PrismaClient, Session } from '.prisma/client';

import { StateRecord } from '../types';

export default class SessionTable {
  session;

  constructor(prisma: PrismaClient) {
    this.session = prisma.session;
  }

  async start(record: StateRecord): Promise<Session> {
    const session = await this.session.create({
      data: {
        startedAt: record.updatedAt,
        voiceChannelId: record.id,
      },
    });

    return session;
  }

  async end(record: StateRecord): Promise<Session | void> {
    const targetSession = await this.session.findFirst({
      select: {
        id: true,
      },
      where: {
        voiceChannelId: record.id,
        endedAt: null,
      },
    });

    if (targetSession === null) {
      return;
    }

    const session = await this.session.update({
      where: {
        id: targetSession.id,
      },
      data: {
        endedAt: record.updatedAt,
      },
    });

    return session;
  }

  async findByVoiceChannelId(
    channelId: string | null
  ): Promise<(Session & { VoiceChannel: { updatedAt: Date } }) | null> {
    if (channelId === null) {
      return null;
    }

    const session = this.session.findFirst({
      orderBy: {
        startedAt: 'desc',
      },
      where: {
        voiceChannelId: channelId,
      },
      include: {
        VoiceChannel: {
          select: {
            updatedAt: true,
          },
        },
      },
    });

    return session;
  }
}
