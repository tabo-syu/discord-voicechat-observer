import dotenv from 'dotenv';
import { Client, Intents } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import EventController from './EventController';

dotenv.config();
const prisma = new PrismaClient();
const intents = new Intents([Intents.NON_PRIVILEGED, 'GUILD_MEMBERS']);
const client = new Client({ ws: { intents } });

const main = async () => {
  client.login(process.env.TOKEN);
  new EventController(client, prisma);
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
