import type { ButtonAction, ActionStep } from '@/lib/types';
import { MultiActionHandler } from './multi-action';

export class RandomActionHandler {
  private static instance: RandomActionHandler;
  private multiActionHandler: MultiActionHandler;
  
  static getInstance(): RandomActionHandler {
    if (!RandomActionHandler.instance) {
      RandomActionHandler.instance = new RandomActionHandler();
    }
    return RandomActionHandler.instance;
  }

  constructor() {
    this.multiActionHandler = MultiActionHandler.getInstance();
  }

  async executeRandomAction(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    if (!action.randomActions || action.randomActions.length === 0) {
      return { success: false, message: 'No random actions defined' };
    }

    // Filter enabled actions
    const enabledActions = action.randomActions.filter(randomAction => randomAction.enabled !== false);
    
    if (enabledActions.length === 0) {
      return { success: false, message: 'No enabled random actions found' };
    }

    // Select random action
    const randomIndex = Math.floor(Math.random() * enabledActions.length);
    const selectedAction = enabledActions[randomIndex];

    // Execute the selected action
    const result = await this.multiActionHandler.executeMultiAction({
      type: 'multi_action',
      value: '',
      steps: [selectedAction]
    });

    if (result.success) {
      return {
        success: true,
        message: `Executed random action ${randomIndex + 1}/${enabledActions.length}: ${selectedAction.name || selectedAction.type}`
      };
    } else {
      return {
        success: false,
        message: `Failed to execute random action: ${result.message}`
      };
    }
  }

  // Helper methods for building random actions
  addRandomAction(
    type: string, 
    value: string, 
    options?: { name?: string; enabled?: boolean; weight?: number }
  ): ActionStep {
    const multiActionHandler = MultiActionHandler.getInstance();
    return multiActionHandler.createStep(type, value, {
      name: options?.name,
      enabled: options?.enabled
    });
  }

  createWeightedRandomActions(actions: Array<{ action: ActionStep; weight: number }>): ActionStep[] {
    // Expand actions based on weight for simple weighted random selection
    const expandedActions: ActionStep[] = [];
    
    actions.forEach(({ action, weight }) => {
      for (let i = 0; i < weight; i++) {
        expandedActions.push({
          ...action,
          id: `${action.id}-weight-${i}`
        });
      }
    });

    return expandedActions;
  }
}