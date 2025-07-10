import type { ButtonAction, ActionStep } from '@/lib/types';

export class MultiActionHandler {
  private static instance: MultiActionHandler;
  
  static getInstance(): MultiActionHandler {
    if (!MultiActionHandler.instance) {
      MultiActionHandler.instance = new MultiActionHandler();
    }
    return MultiActionHandler.instance;
  }

  async executeMultiAction(action: ButtonAction): Promise<{ success: boolean; message: string }> {
    if (!action.steps || action.steps.length === 0) {
      return { success: false, message: 'No steps defined for multi action' };
    }

    const enabledSteps = action.steps.filter(step => step.enabled !== false);
    let successCount = 0;
    let lastError = '';

    for (const step of enabledSteps) {
      try {
        // Add delay before step if specified
        if (step.delay && step.delay > 0) {
          await this.delay(step.delay);
        }

        // Execute the step
        const result = await this.executeStep(step);
        if (result.success) {
          successCount++;
        } else {
          lastError = result.message;
          console.warn(`Multi-action step failed: ${result.message}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error executing multi-action step:', error);
      }
    }

    const totalSteps = enabledSteps.length;
    if (successCount === totalSteps) {
      return { success: true, message: `All ${totalSteps} actions executed successfully` };
    } else if (successCount > 0) {
      return { success: true, message: `${successCount}/${totalSteps} actions executed successfully. Last error: ${lastError}` };
    } else {
      return { success: false, message: `All actions failed. Last error: ${lastError}` };
    }
  }

  private async executeStep(step: ActionStep): Promise<{ success: boolean; message: string }> {
    if (window.electronAPI?.performAction) {
      return await window.electronAPI.performAction({
        type: step.type,
        value: step.value,
        name: step.name || `Step: ${step.type}`
      });
    } else {
      // Web fallback for basic actions
      if (step.type === 'open_url' || step.type === 'website') {
        window.open(step.value, '_blank');
        return { success: true, message: `Opened URL: ${step.value}` };
      }
      return { success: false, message: 'Desktop actions require Electron environment' };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper methods for building multi-actions
  createStep(type: string, value: string, options?: { delay?: number; name?: string; enabled?: boolean }): ActionStep {
    return {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      value,
      delay: options?.delay || 0,
      name: options?.name,
      enabled: options?.enabled !== false
    };
  }

  addDelayStep(ms: number): ActionStep {
    return this.createStep('delay', ms.toString(), { name: `Wait ${ms}ms` });
  }
}