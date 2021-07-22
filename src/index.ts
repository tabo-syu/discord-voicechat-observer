import dotenv from 'dotenv';
import { Client, Intents } from 'discord.js';
import { PrismaClient } from '@prisma/client';

import VoiceSession, { ChannelState } from './VoiceSession';

dotenv.config();
const prisma = new PrismaClient();

const main = async () => {
  const intents = new Intents([Intents.NON_PRIVILEGED, 'GUILD_MEMBERS']);
  const client = new Client({ ws: { intents } });
  client.login(process.env.TOKEN);

  // 初期化処理
  client.on('guildCreate', async (guild) => {
    const members = await guild.members.fetch();
    const users = members
      .filter((member) => member.user.bot === false)
      .map((member) => ({ id: member.user.id }));
    const userRecord = await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });
    console.log(userRecord);

    const guildRecord = await prisma.guild.create({
      data: {
        id: guild.id,
        Users: {
          connect: users,
        },
      },
    });
    console.log(guildRecord);

    const voiceChannels = guild.channels.cache
      .filter((channel) => channel.type === 'voice')
      .map((channel) => ({
        id: channel.id,
        guildId: guild.id,
      }));
    const voiceChannelRecordCount = await prisma.voiceChannel.createMany({
      data: voiceChannels,
      skipDuplicates: true,
    });
    console.log(voiceChannelRecordCount);

    console.log('joined server');
  });

  const vs = new VoiceSession(client);
  vs.on('started', async (oldState: ChannelState, newState: ChannelState) => {
    console.log('started');
  });
  vs.on('ended', (oldState: ChannelState, newState: ChannelState) => {
    console.log('ended');
  });
  vs.on('updated', (oldState: ChannelState, newState: ChannelState) => {
    console.log('ended');
  });
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
