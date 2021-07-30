import { PrismaClient, User, SessionLog, Session } from '.prisma/client';
import { SessionLogAction } from '../types';

export default class SessionLogTable {
  sessionLog;

  constructor(prisma: PrismaClient) {
    this.sessionLog = prisma.sessionLog;
  }

  async insert(
    session: (Session & { VoiceChannel: { updatedAt: Date } }) | null,
    user: User,
    action: SessionLogAction
  ): Promise<SessionLog | void> {
    if (session === null) {
      return;
    }
    const sessionLog = await this.sessionLog.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        action: action,
        createdAt: session.VoiceChannel.updatedAt,
      },
    });

    return sessionLog;
  }
}
