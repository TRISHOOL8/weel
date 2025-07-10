import type { Profile } from '@/lib/types';

export class AppAwareSwitchingHandler {
  private static instance: AppAwareSwitchingHandler;
  private currentActiveApp: string | null = null;
  private appChangeListeners: Set<(appName: string) => void> = new Set();
  
  static getInstance(): AppAwareSwitchingHandler {
    if (!AppAwareSwitchingHandler.instance) {
      AppAwareSwitchingHandler.instance = new AppAwareSwitchingHandler();
    }
    return AppAwareSwitchingHandler.instance;
  }

  /**
   * Initialize app-aware switching monitoring
   */
  initialize(): void {
    // Only initialize if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('App-aware switching requires browser environment');
      return;
    }
    
    // In a real implementation, this would set up system-level app monitoring
    // For now, we'll simulate it with focus events and window title changes
    this.setupWebFallbackMonitoring();
  }

  /**
   * Check if a page switch should occur based on the active app
   */
  shouldSwitchPage(
    activeApp: string, 
    currentProfile: Profile, 
    currentPage: number
  ): { shouldSwitch: boolean; targetPage?: number; reason?: string } {
    // Ensure we have a valid profile and settings
    if (!currentProfile || !currentProfile.appAwareSettings) {
      return { shouldSwitch: false, reason: 'No app-aware settings found' };
    }
    
    if (!currentProfile.appAwareSettings?.enabled) {
      return { shouldSwitch: false, reason: 'App-aware switching disabled' };
    }

    const pinnedPages = currentProfile.pinnedPages || [];
    if (pinnedPages.includes(currentPage)) {
      return { shouldSwitch: false, reason: 'Current page is pinned' };
    }

    const appMappings = currentProfile.appAwareSettings.appMappings || {};
    const targetPage = appMappings[activeApp.toLowerCase()];

    if (targetPage && targetPage !== currentPage && targetPage >= 1) {
      return { 
        shouldSwitch: true, 
        targetPage, 
        reason: `App "${activeApp}" mapped to page ${targetPage}` 
      };
    }

    return { shouldSwitch: false, reason: 'No mapping found for current app' };
  }

  /**
   * Add an app-to-page mapping
   */
  addAppMapping(
    profile: Profile, 
    appName: string, 
    pageNumber: number
  ): Profile {
    const appAwareSettings = profile.appAwareSettings || { enabled: true };
    const appMappings = appAwareSettings.appMappings || {};

    return {
      ...profile,
      appAwareSettings: {
        ...appAwareSettings,
        appMappings: {
          ...appMappings,
          [appName.toLowerCase()]: pageNumber
        }
      }
    };
  }

  /**
   * Remove an app-to-page mapping
   */
  removeAppMapping(profile: Profile, appName: string): Profile {
    const appAwareSettings = profile.appAwareSettings || { enabled: true };
    const appMappings = { ...(appAwareSettings.appMappings || {}) };
    delete appMappings[appName.toLowerCase()];

    return {
      ...profile,
      appAwareSettings: {
        ...appAwareSettings,
        appMappings
      }
    };
  }

  /**
   * Get current active application
   */
  getCurrentActiveApp(): string | null {
    return this.currentActiveApp;
  }

  /**
   * Manually set the active app (for testing or manual control)
   */
  setActiveApp(appName: string): void {
    const previousApp = this.currentActiveApp;
    this.currentActiveApp = appName;
    
    if (previousApp !== appName) {
      this.notifyAppChange(appName);
    }
  }

  /**
   * Add a listener for app changes
   */
  addAppChangeListener(listener: (appName: string) => void): () => void {
    this.appChangeListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.appChangeListeners.delete(listener);
    };
  }

  /**
   * Get suggested page for an app based on usage patterns
   */
  getSuggestedPageForApp(appName: string, profile: Profile): number | null {
    const appMappings = profile.appAwareSettings?.appMappings || {};
    return appMappings[appName.toLowerCase()] || null;
  }

  /**
   * Enable/disable app-aware switching for a profile
   */
  toggleAppAwareSwitching(profile: Profile, enabled: boolean): Profile {
    return {
      ...profile,
      appAwareSettings: {
        ...(profile.appAwareSettings || {}),
        enabled
      }
    };
  }

  private setupWebFallbackMonitoring(): void {
    // Ensure we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // Web fallback - monitor window focus and title changes
    let lastTitle = document.title;
    
    const checkForAppChange = () => {
      const currentTitle = document.title;
      if (currentTitle !== lastTitle) {
        lastTitle = currentTitle;
        this.setActiveApp(currentTitle);
      }
    };

    // Monitor title changes
    try {
      const titleElement = document.querySelector('title');
      if (titleElement) {
        const observer = new MutationObserver(checkForAppChange);
        observer.observe(titleElement, {
          childList: true,
          subtree: true
        });
      }
    } catch (error) {
      console.warn('Could not set up title monitoring:', error);
    }

    // Monitor window focus
    try {
      window.addEventListener('focus', () => {
        checkForAppChange();
      });
    } catch (error) {
      console.warn('Could not set up focus monitoring:', error);
    }

    // Monitor visibility changes
    try {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForAppChange();
        }
      });
    } catch (error) {
      console.warn('Could not set up visibility monitoring:', error);
    }
  }

  private notifyAppChange(appName: string): void {
    this.appChangeListeners.forEach(listener => {
      try {
        listener(appName);
      } catch (error) {
        console.error('Error in app change listener:', error);
      }
    });
  }

  /**
   * Create default app mappings for common applications
   */
  createDefaultAppMappings(): { [appName: string]: number } {
    return {
      // Development
      'visual studio code': 1,
      'code': 1,
      'webstorm': 1,
      'intellij': 1,
      
      // Communication
      'discord': 2,
      'slack': 2,
      'teams': 2,
      'zoom': 2,
      
      // Media
      'spotify': 3,
      'vlc': 3,
      'obs studio': 3,
      'obs': 3,
      
      // Browsers
      'chrome': 1,
      'firefox': 1,
      'safari': 1,
      'edge': 1,
      
      // Gaming
      'steam': 4,
      'epic games': 4,
      'battle.net': 4
    };
  }
}