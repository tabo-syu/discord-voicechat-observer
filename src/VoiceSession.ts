import EventEmitter from 'events';
import { VoiceChannel, User } from '@prisma/client';

export default class VoiceSession extends EventEmitter {
  constructor() {
    super();
  }

  submit(
    oldRecords: (VoiceChannel & { Participants: User[] })[],
    newRecords: (VoiceChannel & { Participants: User[] })[]
  ): void {
    for (const newRecord of newRecords) {
      const oldRecord = oldRecords.find((record) => record.id === newRecord.id);

      if (oldRecord === undefined) {
        continue;
      }

      if (
        oldRecord.Participants.length === 0 &&
        newRecord.Participants.length === 1
      ) {
        this.emit('started', oldRecord, newRecord);
      } else if (
        oldRecord.Participants.length === 1 &&
        newRecord.Participants.length === 0
      ) {
        this.emit('ended', oldRecord, newRecord);
      } else if (
        oldRecord.Participants.length !== newRecord.Participants.length
      ) {
        this.emit('updated', oldRecord, newRecord);
      }
    }
  }
}
