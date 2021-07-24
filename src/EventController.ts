import { PrismaClient } from '@prisma/client';
import { Client } from 'discord.js';

import TableManager from './Tables/TableManager';
import VoiceSession from './VoiceSession';
import { StateRecord } from './types';

export default class EventController {
  db: TableManager;
  client: Client;
  vs: VoiceSession;

  constructor(client: Client, prisma: PrismaClient) {
    this.client = client;
    this.db = new TableManager(prisma);
    this.vs = new VoiceSession();

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
      this.vs.submit(oldChannelState, newChannelState);
    });

    this.vs.on(
      'started',
      (oldState: StateRecord[], newState: StateRecord[]) => {
        console.log('started');
        console.log('------------------');
      }
    );

    this.vs.on('ended', (oldState: StateRecord[], newState: StateRecord[]) => {
      console.log('ended');
      console.log('------------------');
    });

    this.vs.on(
      'updated',
      (oldState: StateRecord[], newState: StateRecord[]) => {
        console.log('updated');
        console.log('------------------');
      }
    );
  }
}
