import EventEmitter from 'events';

import { StateRecord } from './types';

export default class VoiceSession extends EventEmitter {
  constructor() {
    super();
  }

  submit(oldRecords: StateRecord[], newRecords: StateRecord[]): void {
    for (const newRecord of newRecords) {
      const oldRecord = oldRecords.find((record) => record.id === newRecord.id);

      if (oldRecord === undefined) {
        continue;
      }

      const oldUsers = oldRecord.Participants;
      const newUsers = newRecord.Participants;

      if (oldUsers.length < newUsers.length) {
        const diffUser = newUsers.filter(
          (newUser) =>
            oldUsers.find((oldUser) => oldUser.id === newUser.id) === undefined
        )[0];
        this.emit('userJoined', diffUser, oldRecord, newRecord);
      }

      if (oldUsers.length > newUsers.length) {
        const diffUser = oldUsers.filter(
          (oldUser) =>
            newUsers.find((newUser) => newUser.id === oldUser.id) === undefined
        )[0];
        this.emit('userLeft', diffUser, oldRecord, newRecord);
      }
    }
  }
}
