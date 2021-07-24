import { VoiceChannel, User } from '@prisma/client';

export type StateRecord = VoiceChannel & { Participants: User[] };
