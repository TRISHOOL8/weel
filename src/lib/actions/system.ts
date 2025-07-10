import type { ButtonAction } from '@/lib/types';

export class SystemHandler {
  private static instance: SystemHandler;
  private hotkeyStates: Map<string, 'primary' | 'secondary'> = new Map();
  
  static getInstance(): SystemHandler {
    if (!SystemHandler.instance) {
      SystemHandler.instance = new SystemHandler();
    }
    return SystemHandler.instance;
  }

  async executeSystemAction(
    action: ButtonAction,
    buttonId: string,
    updateAction: (updatedAction: ButtonAction) => void
  ): Promise<{ success: boolean; message: string }> {
    switch (action.type) {
      case 'website':
      case 'system_website':
      case 'open_url':
        return this.openWebsite(action);
        
      case 'hotkey_switch':
      case 'system_hotkey_switch':
        return this.executeHotkeySwitch(action, buttonId, updateAction);
        
      case 'hotkey':
      case 'system_hotkey':
        return this.executeHotkey(action);
        
      case 'open_application':
      case 'system_open_app':
        return this.openApplication(action);
        
      case 'system_open':
        return this.openFileOrFolder(action);
        
      case 'system_close':
        return this.closeApplication(action);
        
      case 'system_text':
        return this.typeText(action);
        
      case 'system_multimedia':
        return this.executeMultimedia(action);
        
      case 'volume_control':
      case 'volume_control_input':
      case 'volume_control_output':
        return this.executeVolumeControl(action);
        
      default:
        return { success: false, message: `Unknown system action: ${action.type}` };
    }
  }

  private async openWebsite(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const url = action.value;
    if (!url) {
      return { success: false, message: 'No URL specified' };
    }

    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;

      if (window.electronAPI?.performAction) {
        return await window.electronAPI.performAction({
          type: 'open_url',
          value: fullUrl,
          name: action.name || 'Open Website'
        });
      } else {
        // Web fallback
        window.open(fullUrl, '_blank');
        return { success: true, message: `Opened ${fullUrl}` };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to open website: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeHotkeySwitch(
    action: ButtonAction,
    buttonId: string,
    updateAction: (updatedAction: ButtonAction) => void
  ): Promise<{ success: boolean; message: string }> {
    const primaryHotkey = action.primaryHotkey || action.value;
    const secondaryHotkey = action.secondaryHotkey;

    if (!primaryHotkey || !secondaryHotkey) {
      return { success: false, message: 'Both primary and secondary hotkeys must be specified' };
    }

    // Get current state (default to primary)
    const currentState = this.hotkeyStates.get(buttonId) || 'primary';
    const nextState = currentState === 'primary' ? 'secondary' : 'primary';
    const hotkeyToExecute = currentState === 'primary' ? primaryHotkey : secondaryHotkey;

    // Execute the hotkey
    const result = await this.executeHotkey({
      type: 'hotkey',
      value: hotkeyToExecute,
      name: `${action.name || 'Hotkey Switch'} (${currentState})`
    });

    if (result.success) {
      // Update state for next execution
      this.hotkeyStates.set(buttonId, nextState);
      
      // Update the action to reflect current state
      const updatedAction = {
        ...action,
        currentState: nextState
      };
      updateAction(updatedAction);

      return {
        success: true,
        message: `Executed ${currentState} hotkey: ${hotkeyToExecute}. Next: ${nextState}`
      };
    }

    return result;
  }

  private async executeHotkey(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const hotkey = action.value;
    if (!hotkey) {
      return { success: false, message: 'No hotkey specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'hotkey',
        value: hotkey,
        name: action.name || 'Hotkey'
      });
    } else {
      return {
        success: false,
        message: 'Hotkey execution requires desktop environment'
      };
    }
  }

  private async openApplication(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const appPath = action.value;
    if (!appPath) {
      return { success: false, message: 'No application path specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'system_open_app',
        value: appPath,
        name: action.name || 'Open Application'
      });
    } else {
      return {
        success: false,
        message: 'Application launching requires desktop environment'
      };
    }
  }

  private async openFileOrFolder(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const path = action.value;
    if (!path) {
      return { success: false, message: 'No file or folder path specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'system_open',
        value: path,
        name: action.name || 'Open File/Folder'
      });
    } else {
      return {
        success: false,
        message: 'File/folder opening requires desktop environment'
      };
    }
  }

  private async closeApplication(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const appName = action.value;
    if (!appName) {
      return { success: false, message: 'No application name specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'system_close',
        value: appName,
        name: action.name || 'Close Application'
      });
    } else {
      return {
        success: false,
        message: 'Application closing requires desktop environment'
      };
    }
  }

  private async typeText(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const text = action.value;
    if (!text) {
      return { success: false, message: 'No text specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'system_text',
        value: text,
        name: action.name || 'Type Text'
      });
    } else {
      return {
        success: false,
        message: 'Text typing requires desktop environment'
      };
    }
  }

  private async executeMultimedia(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const command = action.value; // play_pause, next, prev, stop
    if (!command) {
      return { success: false, message: 'No multimedia command specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'system_multimedia',
        value: command,
        name: action.name || 'Multimedia Control'
      });
    } else {
      return {
        success: false,
        message: 'Multimedia control requires desktop environment'
      };
    }
  }

  private async executeVolumeControl(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    const command = action.value; // increase, decrease, mute_toggle
    if (!command) {
      return { success: false, message: 'No volume command specified' };
    }

    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: 'volume_control',
        value: command,
        name: action.name || 'Volume Control'
      });
    } else {
      return {
        success: false,
        message: 'Volume control requires desktop environment'
      };
    }
  }

  // Utility methods
  createHotkeySwitch(primaryHotkey: string, secondaryHotkey: string, name?: string): ButtonAction {
    return {
      type: 'hotkey_switch',
      value: primaryHotkey,
      primaryHotkey,
      secondaryHotkey,
      currentState: 'primary',
      name: name || 'Hotkey Switch'
    };
  }

  createWebsiteAction(url: string, name?: string): ButtonAction {
    return {
      type: 'website',
      value: url,
      name: name || 'Open Website'
    };
  }

  createApplicationAction(appPath: string, name?: string): ButtonAction {
    return {
      type: 'open_application',
      value: appPath,
      name: name || 'Open Application'
    };
  }
}