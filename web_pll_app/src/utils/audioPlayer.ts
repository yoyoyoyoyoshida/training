import { getAudioPath } from '../data/pllData';

type SoundKind = 'correct' | 'wrong';

class AudioPlayer {
  private readonly buffers = new Map<SoundKind, HTMLAudioElement>();

  private ensure(kind: SoundKind) {
    if (!this.buffers.has(kind)) {
      const audio = new Audio(getAudioPath(kind));
      audio.preload = 'auto';
      this.buffers.set(kind, audio);
    }
    return this.buffers.get(kind)!;
  }

  async play(kind: SoundKind) {
    try {
      const audio = this.ensure(kind);
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn('Failed to play sound', kind, error);
    }
  }
}

export const audioPlayer = new AudioPlayer();
