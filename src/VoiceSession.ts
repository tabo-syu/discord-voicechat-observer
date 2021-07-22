import { Client, Collection, GuildMember } from 'discord.js';
import EventEmitter from 'events';

export type ChannelState = {
  id: string;
  guildId: string;
  members: Collection<string, GuildMember>;
};

export default class VoiceSession extends EventEmitter {
  client: Client;
  voiceChannelsState: ChannelState[];

  constructor(client: Client) {
    super();
    this.client = client;
    this.voiceChannelsState = [];

    client.on('voiceStateUpdate', (state) => {
      const guildVoiceChannelsState: ChannelState[] = state.guild.channels.cache
        .filter((channel) => channel.type === 'voice')
        .map((channel) => ({
          id: channel.id,
          guildId: channel.guild.id,
          members: channel.members,
        }));

      for (const newChannelState of guildVoiceChannelsState) {
        const oldChannelState = this.voiceChannelsState.find(
          (oldState) => oldState.id === newChannelState.id
        );

        if (this.#isStarted(oldChannelState, newChannelState)) {
          // セッション開始
          this.emit('started', oldChannelState, newChannelState);
        } else if (this.#isEnded(oldChannelState, newChannelState)) {
          // セッション終了
          this.emit('ended', oldChannelState, newChannelState);
        } else if (this.#isUpdated(oldChannelState, newChannelState)) {
          // セッション更新
          this.emit('updated', oldChannelState, newChannelState);
        }

        // 状態の更新
        const index = this.voiceChannelsState.findIndex(
          (oldState) => oldState.id === newChannelState.id
        );
        if (index === -1) {
          this.voiceChannelsState.push(newChannelState);
        } else {
          this.voiceChannelsState[index] = newChannelState;
        }
      }
    });
  }

  #isStarted(
    oldState: ChannelState | undefined,
    newState: ChannelState
  ): boolean {
    if (
      (oldState === undefined || oldState?.members.size === 0) &&
      newState.members.size === 1
    ) {
      return true;
    }
    return false;
  }

  #isEnded(
    oldState: ChannelState | undefined,
    newState: ChannelState
  ): boolean {
    if (oldState?.members.size === 1 && newState.members.size === 0) {
      return true;
    }
    return false;
  }

  #isUpdated(
    oldState: ChannelState | undefined,
    newState: ChannelState
  ): boolean {
    if (
      oldState !== undefined &&
      oldState?.members.size !== newState.members.size
    ) {
      return true;
    }
    return false;
  }
}
