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
    const channelState = guild.channels.cache
      .filter((channel) => channel.type === 'voice')
      .map((channel) => ({
        id: channel.id,
        guildId: channel.guild.id,
        members: channel.members,
      }));
    console.log(vs.addState(channelState));

    await prisma.$connect();
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
    await prisma.$disconnect();

    console.log(voiceChannelRecordCount);
    console.log('joined server');
  });

  // サーバーにユーザーが追加されたとき
  client.on('guildMemberAdd', async (member) => {
    if (member.user.bot) {
      return;
    }

    await prisma.$connect();
    const userId = member.user.id;
    await prisma.user.upsert({
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
    await prisma.$disconnect();
  });

  // セッション時の関数
  const vs = new VoiceSession(client);
  vs.on('started', async (oldState: ChannelState, newState: ChannelState) => {
    console.log('started');

    await prisma.$connect();
    const users = newState.members.map((member) => ({ id: member.user.id }));
    const record = await prisma.session.create({
      data: {
        VoiceChannel: {
          connect: { id: newState.id },
        },
        Users: {
          connect: users,
        },
      },
    });
    await prisma.$disconnect();

    console.log(record);
    console.log('--------------------');
  });

  vs.on('ended', async (oldState: ChannelState, newState: ChannelState) => {
    console.log('ended');

    await prisma.$connect();
    const record = await prisma.session.updateMany({
      where: {
        isUsing: true,
        voiceChannelId: newState.id,
      },
      data: {
        isUsing: false,
        endedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    console.log(record);
    console.log('--------------------');
  });

  vs.on('updated', async (oldState: ChannelState, newState: ChannelState) => {
    console.log('updated');

    if (oldState.members.size > newState.members.size) {
      return;
    }

    await prisma.$connect();
    const session = await prisma.session.findFirst({
      where: {
        isUsing: true,
        voiceChannelId: newState.id,
      },
    });

    const users = newState.members.map((member) => ({ id: member.user.id }));
    const record = await prisma.session.update({
      where: {
        id: session?.id,
      },
      data: {
        Users: {
          connect: users,
        },
      },
    });
    await prisma.$disconnect();

    console.log(record);
    console.log('--------------------');
  });
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
