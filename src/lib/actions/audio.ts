import type { ButtonAction } from '@/lib/types';

export class AudioHandler {
  private static instance: AudioHandler;
  private audioInstances: Map<string, HTMLAudioElement> = new Map();
  private globalAudioId: string | null = null;
  
  static getInstance(): AudioHandler {
    if (!AudioHandler.instance) {
      AudioHandler.instance = new AudioHandler();
    }
    return AudioHandler.instance;
  }

  async executeAudioAction(action: ButtonAction, buttonId: string): Promise<{ success: boolean; message: string }> {
    switch (action.type) {
      case 'play_audio':
      case 'soundboard_play':
        return this.playAudio(action, buttonId);
        
      case 'stop_audio':
      case 'soundboard_stop':
        return this.stopAudio(action, buttonId);
        
      default:
        return { success: false, message: `Unknown audio action: ${action.type}` };
    }
  }

  private async playAudio(action: ButtonAction, buttonId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use Electron API if available for better audio support
      if (window.electronAPI?.playAudio) {
        const audioFile = action.audioFile || action.value;
        if (!audioFile) {
          return { success: false, message: 'No audio file specified' };
        }

        const result = await window.electronAPI.playAudio(audioFile, {
          volume: action.volume || 1.0,
          loop: action.loop || false,
          outputDevice: action.outputDevice
        });

        if (result.success && result.audioId) {
          this.globalAudioId = result.audioId;
        }

        return result;
      }

      // Web fallback
      const audioFile = action.audioFile || action.value;
      if (!audioFile) {
        return { success: false, message: 'No audio file specified' };
      }

      // Stop existing audio for this button
      this.stopAudioForButton(buttonId);

      const audio = new Audio(audioFile);
      audio.volume = Math.max(0, Math.min(1, action.volume || 1.0));
      audio.loop = action.loop || false;

      // Store audio instance
      this.audioInstances.set(buttonId, audio);
      this.globalAudioId = buttonId;

      // Play audio
      await audio.play();

      // Clean up when audio ends (if not looping)
      audio.addEventListener('ended', () => {
        if (!audio.loop) {
          this.audioInstances.delete(buttonId);
          if (this.globalAudioId === buttonId) {
            this.globalAudioId = null;
          }
        }
      });

      return {
        success: true,
        message: `Playing audio: ${audioFile.split('/').pop() || audioFile}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async stopAudio(action: ButtonAction, buttonId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use Electron API if available
      if (window.electronAPI?.stopAudio) {
        const result = await window.electronAPI.stopAudio(this.globalAudioId || undefined);
        if (result.success) {
          this.globalAudioId = null;
        }
        return result;
      }

      // Web fallback
      if (action.value === 'all' || !action.value) {
        // Stop all audio
        let stoppedCount = 0;
        this.audioInstances.forEach((audio, id) => {
          audio.pause();
          audio.currentTime = 0;
          stoppedCount++;
        });
        this.audioInstances.clear();
        this.globalAudioId = null;

        return {
          success: true,
          message: stoppedCount > 0 ? `Stopped ${stoppedCount} audio instance(s)` : 'No audio was playing'
        };
      } else {
        // Stop specific audio
        const targetId = action.value || buttonId;
        const audio = this.audioInstances.get(targetId);
        
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          this.audioInstances.delete(targetId);
          
          if (this.globalAudioId === targetId) {
            this.globalAudioId = null;
          }

          return {
            success: true,
            message: 'Audio stopped'
          };
        } else {
          return {
            success: false,
            message: 'No audio playing for this button'
          };
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to stop audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private stopAudioForButton(buttonId: string): void {
    const audio = this.audioInstances.get(buttonId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.audioInstances.delete(buttonId);
      
      if (this.globalAudioId === buttonId) {
        this.globalAudioId = null;
      }
    }
  }

  // Utility methods
  isAudioPlaying(buttonId?: string): boolean {
    if (buttonId) {
      const audio = this.audioInstances.get(buttonId);
      return audio ? !audio.paused : false;
    }
    
    // Check if any audio is playing
    for (const audio of this.audioInstances.values()) {
      if (!audio.paused) {
        return true;
      }
    }
    return false;
  }

  getCurrentlyPlayingAudio(): string | null {
    return this.globalAudioId;
  }

  stopAllAudio(): void {
    this.audioInstances.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.audioInstances.clear();
    this.globalAudioId = null;
  }
}