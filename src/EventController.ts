import { PrismaClient, User } from '@prisma/client';
import { Client } from 'discord.js';

import TableManager from './Tables/TableManager';
import VoiceSession from './VoiceSession';
import { StateRecord } from './types';

export default class EventController {
  db: TableManager;
  client: Client;
  voiceSession: VoiceSession;

  constructor(client: Client, prisma: PrismaClient) {
    this.client = client;
    this.db = new TableManager(prisma);
    this.voiceSession = new VoiceSession();

    this.client.on('guildCreate', async (guild) => {
      await this.db.initialize(guild);
    });

    this.client.on('guildMemberAdd', async (member) => {
      await this.db.addGuildParticipant(member);
    });

    this.client.on('voiceStateUpdate', async (newState) => {
      const guildId = newState.guild.id;
      const [oldChannelState, newChannelState] =
        await this.db.updateVoiceChannels(guildId, newState);
      this.voiceSession.submit(oldChannelState, newChannelState);
    });

    this.voiceSession.on(
      'userJoined',
      async (user: User, oldRecord: StateRecord, newRecord: StateRecord) => {
        const oldUser = oldRecord.Participants;
        const newUser = newRecord.Participants;

        if (oldUser.length === 0 && newUser.length === 1) {
          console.log('-------------');
          console.log('session start');
          await this.db.startSession(newRecord);
        }
        console.log('user joined', user);
        await this.db.addSessionLog(user, 'joined');
      }
    );

    this.voiceSession.on(
      'userLeft',
      async (user: User, oldRecord: StateRecord, newRecord: StateRecord) => {
        const oldUser = oldRecord.Participants;
        const newUser = newRecord.Participants;

        console.log('user left', user);
        await this.db.addSessionLog(user, 'left');
        if (oldUser.length === 1 && newUser.length === 0) {
          console.log('session end');
          console.log('-------------');
          await this.db.endSession(newRecord);
        }
      }
    );
  }
}
