import type { ButtonAction, ActionStep } from '@/lib/types';
import { MultiActionHandler } from './multi-action';

export class MultiActionSwitchHandler {
  private static instance: MultiActionSwitchHandler;
  private multiActionHandler: MultiActionHandler;
  
  static getInstance(): MultiActionSwitchHandler {
    if (!MultiActionSwitchHandler.instance) {
      MultiActionSwitchHandler.instance = new MultiActionSwitchHandler();
    }
    return MultiActionSwitchHandler.instance;
  }

  constructor() {
    this.multiActionHandler = MultiActionHandler.getInstance();
  }

  async executeMultiActionSwitch(
    action: ButtonAction, 
    updateAction: (updatedAction: ButtonAction) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!action.actionSets || action.actionSets.length === 0) {
      return { success: false, message: 'No action sets defined for multi action switch' };
    }

    // Get current set index (default to 0)
    const currentIndex = action.currentSetIndex || 0;
    const currentSet = action.actionSets[currentIndex];

    if (!currentSet || currentSet.length === 0) {
      return { success: false, message: `Action set ${currentIndex + 1} is empty` };
    }

    // Execute current set as a multi-action
    const result = await this.multiActionHandler.executeMultiAction({
      type: 'multi_action',
      value: '',
      steps: currentSet
    });

    // Update to next set for next execution
    const nextIndex = (currentIndex + 1) % action.actionSets.length;
    const updatedAction = {
      ...action,
      currentSetIndex: nextIndex
    };
    
    updateAction(updatedAction);

    if (result.success) {
      return {
        success: true,
        message: `Executed action set ${currentIndex + 1}/${action.actionSets.length}. Next: Set ${nextIndex + 1}`
      };
    } else {
      return {
        success: false,
        message: `Failed to execute action set ${currentIndex + 1}: ${result.message}`
      };
    }
  }

  // Helper methods for building multi-action switches
  createActionSet(steps: ActionStep[]): ActionStep[] {
    return steps.map(step => ({
      ...step,
      id: step.id || `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  createToggleSwitch(
    primaryAction: { type: string; value: string; name?: string },
    secondaryAction: { type: string; value: string; name?: string }
  ): ActionStep[][] {
    const multiActionHandler = MultiActionHandler.getInstance();
    
    return [
      [multiActionHandler.createStep(primaryAction.type, primaryAction.value, { name: primaryAction.name })],
      [multiActionHandler.createStep(secondaryAction.type, secondaryAction.value, { name: secondaryAction.name })]
    ];
  }
}