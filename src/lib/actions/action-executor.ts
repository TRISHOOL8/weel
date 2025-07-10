import type { ButtonAction, ButtonConfig, Profile } from '@/lib/types';
import { MultiActionHandler } from './multi-action';
import { MultiActionSwitchHandler } from './multi-action-switch';
import { RandomActionHandler } from './random-action';
import { NavigationHandler } from './navigation';
import { AudioHandler } from './audio';
import { TimerHandler } from './timer';
import { SystemHandler } from './system';

export class ActionExecutor {
  private static instance: ActionExecutor;
  
  private multiActionHandler: MultiActionHandler;
  private multiActionSwitchHandler: MultiActionSwitchHandler;
  private randomActionHandler: RandomActionHandler;
  private navigationHandler: NavigationHandler;
  private audioHandler: AudioHandler;
  private timerHandler: TimerHandler;
  private systemHandler: SystemHandler;

  static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor();
    }
    return ActionExecutor.instance;
  }

  constructor() {
    try {
      this.multiActionHandler = MultiActionHandler.getInstance();
      this.multiActionSwitchHandler = MultiActionSwitchHandler.getInstance();
      this.randomActionHandler = RandomActionHandler.getInstance();
      this.navigationHandler = NavigationHandler.getInstance();
      this.audioHandler = AudioHandler.getInstance();
      this.timerHandler = TimerHandler.getInstance();
      this.systemHandler = SystemHandler.getInstance();
    } catch (error) {
      console.error('Error initializing action handlers:', error);
      throw error;
    }
  }

  async executeAction(
    action: ButtonAction,
    buttonId: string,
    context: {
      currentProfile: Profile | null;
      profiles: Profile[];
      onProfileChange: (profileId: string) => void;
      onCreateProfile: (name?: string) => string;
      updateProfile: (profileId: string, updates: Partial<Profile>) => void;
      updateButton: (buttonId: string, updates: Partial<ButtonConfig>) => void;
      updateAction: (updatedAction: ButtonAction) => void;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (action.type) {
        // Multi Actions
        case 'multi_action':
          return await this.multiActionHandler.executeMultiAction(action);
          
        case 'multi_action_switch':
          return await this.multiActionSwitchHandler.executeMultiActionSwitch(
            action, 
            context.updateAction
          );
          
        case 'random_action':
          return await this.randomActionHandler.executeRandomAction(action);

        // Navigation
        case 'create_folder':
        case 'navigation_create_folder':
        case 'switch_profile':
        case 'navigation_switch_profile':
        case 'previous_page':
        case 'navigation_previous_page':
        case 'next_page':
        case 'navigation_next_page':
        case 'go_to_page':
        case 'navigation_go_to_page':
        case 'page_indicator':
        case 'navigation_page_indicator':
          return await this.navigationHandler.executeNavigation(
            action,
            context.currentProfile,
            context.profiles,
            context.onProfileChange,
            context.onCreateProfile,
            context.updateProfile
          );

        // Audio
        case 'play_audio':
        case 'soundboard_play':
        case 'stop_audio':
        case 'soundboard_stop':
          return await this.audioHandler.executeAudioAction(action, buttonId);

        // Timer
        case 'countdown_timer':
        case 'timer':
        case 'delay':
        case 'sleep':
          return await this.timerHandler.executeTimer(
            action, 
            buttonId, 
            context.updateButton
          );

        // System Actions
        case 'website':
        case 'system_website':
        case 'open_url':
        case 'hotkey_switch':
        case 'system_hotkey_switch':
        case 'hotkey':
        case 'system_hotkey':
        case 'open_application':
        case 'system_open_app':
        case 'system_open':
        case 'system_close':
        case 'system_text':
        case 'system_multimedia':
        case 'volume_control':
        case 'volume_control_input':
        case 'volume_control_output':
          return await this.systemHandler.executeSystemAction(
            action, 
            buttonId, 
            context.updateAction
          );

        // Legacy actions - delegate to Electron or provide fallback
        case 'run_script':
        case 'plugin':
          return await this.executeLegacyAction(action);

        case 'none':
          return { success: true, message: 'No action configured' };

        default:
          return { success: false, message: `Unknown action type: ${action.type}` };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return {
        success: false,
        message: `Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeLegacyAction(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: action.type,
        value: action.value,
        name: action.name || `Legacy: ${action.type}`
      });
    } else {
      return {
        success: false,
        message: `Legacy action "${action.type}" requires desktop environment`
      };
    }
  }

  // Cleanup methods
  cleanup(): void {
    this.audioHandler.stopAllAudio();
    this.timerHandler.stopAllTimers();
  }

  // Utility methods for action creation
  createMultiAction(steps: Array<{ type: string; value: string; delay?: number; name?: string }>): ButtonAction {
    return {
      type: 'multi_action',
      value: '',
      steps: steps.map(step => this.multiActionHandler.createStep(step.type, step.value, {
        delay: step.delay,
        name: step.name
      }))
    };
  }

  createMultiActionSwitch(
    actionSets: Array<Array<{ type: string; value: string; name?: string }>>
  ): ButtonAction {
    return {
      type: 'multi_action_switch',
      value: '',
      actionSets: actionSets.map(set => 
        set.map(action => this.multiActionHandler.createStep(action.type, action.value, {
          name: action.name
        }))
      ),
      currentSetIndex: 0
    };
  }

  createRandomAction(actions: Array<{ type: string; value: string; name?: string }>): ButtonAction {
    return {
      type: 'random_action',
      value: '',
      randomActions: actions.map(action => this.multiActionHandler.createStep(action.type, action.value, {
        name: action.name
      }))
    };
  }
}