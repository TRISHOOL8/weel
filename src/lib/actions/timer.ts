import type { ButtonAction, ButtonConfig } from '@/lib/types';

export interface TimerState {
  isRunning: boolean;
  remainingTime: number;
  startTime: number;
  duration: number;
  interval?: NodeJS.Timeout;
}

export class TimerHandler {
  private static instance: TimerHandler;
  private timers: Map<string, TimerState> = new Map();
  
  static getInstance(): TimerHandler {
    if (!TimerHandler.instance) {
      TimerHandler.instance = new TimerHandler();
    }
    return TimerHandler.instance;
  }

  async executeTimer(
    action: ButtonAction, 
    buttonId: string,
    updateButton: (buttonId: string, updates: Partial<ButtonConfig>) => void
  ): Promise<{ success: boolean; message: string }> {
    switch (action.type) {
      case 'countdown_timer':
      case 'timer':
        return this.startCountdownTimer(action, buttonId, updateButton);
        
      case 'delay':
      case 'sleep':
        return this.executeDelay(action);
        
      default:
        return { success: false, message: `Unknown timer action: ${action.type}` };
    }
  }

  private async startCountdownTimer(
    action: ButtonAction,
    buttonId: string,
    updateButton: (buttonId: string, updates: Partial<ButtonConfig>) => void
  ): Promise<{ success: boolean; message: string }> {
    const duration = action.duration || parseInt(action.value) || 60; // Default 60 seconds
    
    // Stop existing timer for this button
    this.stopTimer(buttonId);

    const startTime = Date.now();
    const timerState: TimerState = {
      isRunning: true,
      remainingTime: duration,
      startTime,
      duration
    };

    // Update button to show initial timer state
    updateButton(buttonId, {
      timerState: {
        isRunning: true,
        remainingTime: duration,
        startTime
      }
    });

    // Start countdown interval
    timerState.interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      if (remaining <= 0) {
        // Timer finished
        this.stopTimer(buttonId);
        updateButton(buttonId, {
          timerState: {
            isRunning: false,
            remainingTime: 0,
            startTime: 0
          }
        });
        
        // You could trigger additional actions here when timer completes
        console.log(`Timer ${buttonId} completed`);
      } else {
        // Update remaining time
        timerState.remainingTime = remaining;
        updateButton(buttonId, {
          timerState: {
            isRunning: true,
            remainingTime: remaining,
            startTime
          }
        });
      }
    }, 1000);

    this.timers.set(buttonId, timerState);

    return {
      success: true,
      message: `Timer started: ${this.formatTime(duration)}`
    };
  }

  private async executeDelay(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const delayMs = parseInt(action.value) || 1000; // Default 1 second
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Delayed for ${delayMs}ms`
        });
      }, delayMs);
    });
  }

  stopTimer(buttonId: string): void {
    const timer = this.timers.get(buttonId);
    if (timer && timer.interval) {
      clearInterval(timer.interval);
      this.timers.delete(buttonId);
    }
  }

  stopAllTimers(): void {
    this.timers.forEach((timer, buttonId) => {
      if (timer.interval) {
        clearInterval(timer.interval);
      }
    });
    this.timers.clear();
  }

  getTimerState(buttonId: string): TimerState | null {
    return this.timers.get(buttonId) || null;
  }

  isTimerRunning(buttonId: string): boolean {
    const timer = this.timers.get(buttonId);
    return timer ? timer.isRunning : false;
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Utility method to create timer actions
  createTimerAction(duration: number, showCountdown: boolean = true): ButtonAction {
    return {
      type: 'countdown_timer',
      value: duration.toString(),
      duration,
      showCountdown
    };
  }

  createDelayAction(milliseconds: number): ButtonAction {
    return {
      type: 'delay',
      value: milliseconds.toString()
    };
  }
}