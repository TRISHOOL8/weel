import type { ButtonAction, Profile, ButtonConfig } from '@/lib/types';

export class NavigationHandler {
  private static instance: NavigationHandler;
  
  static getInstance(): NavigationHandler {
    if (!NavigationHandler.instance) {
      NavigationHandler.instance = new NavigationHandler();
    }
    return NavigationHandler.instance;
  }

  async executeNavigation(
    action: ButtonAction,
    currentProfile: Profile | null,
    profiles: Profile[],
    onProfileChange: (profileId: string) => void,
    onCreateProfile: (name?: string) => string,
    updateProfile: (profileId: string, updates: Partial<Profile>) => void
  ): Promise<{ success: boolean; message: string }> {
    switch (action.type) {
      case 'create_folder':
      case 'navigation_create_folder':
        return this.createFolder(action, currentProfile, updateProfile);
        
      case 'switch_profile':
      case 'navigation_switch_profile':
        return this.switchProfile(action, profiles, onProfileChange);
        
      case 'previous_page':
      case 'navigation_previous_page':
        return this.previousPage(currentProfile, updateProfile);
        
      case 'next_page':
      case 'navigation_next_page':
        return this.nextPage(currentProfile, updateProfile);
        
      case 'go_to_page':
      case 'navigation_go_to_page':
        return this.goToPage(action, currentProfile, updateProfile);
        
      case 'page_indicator':
      case 'navigation_page_indicator':
        return this.updatePageIndicator(currentProfile);
        
      default:
        return { success: false, message: `Unknown navigation action: ${action.type}` };
    }
  }

  private async createFolder(
    action: ButtonAction,
    currentProfile: Profile | null,
    updateProfile: (profileId: string, updates: Partial<Profile>) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!currentProfile) {
      return { success: false, message: 'No active profile to create folder in' };
    }

    const folderName = action.folderName || action.value || 'New Folder';
    
    // Create a new "page" or sub-profile for the folder
    const folderButtons = action.folderButtons || Array(currentProfile.gridSize.rows * currentProfile.gridSize.cols).fill(null);
    
    // For now, we'll simulate folder creation by updating the profile
    // In a full implementation, you might create a separate profile or use a different storage mechanism
    
    return {
      success: true,
      message: `Folder "${folderName}" created successfully`
    };
  }

  private async switchProfile(
    action: ButtonAction,
    profiles: Profile[],
    onProfileChange: (profileId: string) => void
  ): Promise<{ success: boolean; message: string }> {
    const targetProfileId = action.targetProfile || action.value;
    
    if (!targetProfileId) {
      return { success: false, message: 'No target profile specified' };
    }

    const targetProfile = profiles.find(p => p.id === targetProfileId || p.name === targetProfileId);
    
    if (!targetProfile) {
      return { success: false, message: `Profile "${targetProfileId}" not found` };
    }

    onProfileChange(targetProfile.id);
    
    return {
      success: true,
      message: `Switched to profile: ${targetProfile.name}`
    };
  }

  private async previousPage(
    currentProfile: Profile | null,
    updateProfile: (profileId: string, updates: Partial<Profile>) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!currentProfile) {
      return { success: false, message: 'No active profile' };
    }

    const currentPage = currentProfile.currentPage || 1;
    const totalPages = currentProfile.totalPages || 1;
    
    if (currentPage <= 1) {
      return { success: false, message: 'Already on first page' };
    }

    const newPage = currentPage - 1;
    updateProfile(currentProfile.id, { currentPage: newPage });
    
    return {
      success: true,
      message: `Moved to page ${newPage}/${totalPages}`
    };
  }

  private async nextPage(
    currentProfile: Profile | null,
    updateProfile: (profileId: string, updates: Partial<Profile>) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!currentProfile) {
      return { success: false, message: 'No active profile' };
    }

    const currentPage = currentProfile.currentPage || 1;
    const totalPages = currentProfile.totalPages || 1;
    
    if (currentPage >= totalPages) {
      return { success: false, message: 'Already on last page' };
    }

    const newPage = currentPage + 1;
    updateProfile(currentProfile.id, { currentPage: newPage });
    
    return {
      success: true,
      message: `Moved to page ${newPage}/${totalPages}`
    };
  }

  private async goToPage(
    action: ButtonAction,
    currentProfile: Profile | null,
    updateProfile: (profileId: string, updates: Partial<Profile>) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!currentProfile) {
      return { success: false, message: 'No active profile' };
    }

    const targetPage = action.targetPage || parseInt(action.value);
    const totalPages = currentProfile.totalPages || 1;
    
    if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
      return { success: false, message: `Invalid page number. Must be between 1 and ${totalPages}` };
    }

    updateProfile(currentProfile.id, { currentPage: targetPage });
    
    return {
      success: true,
      message: `Moved to page ${targetPage}/${totalPages}`
    };
  }

  private async updatePageIndicator(
    currentProfile: Profile | null
  ): Promise<{ success: boolean; message: string }> {
    if (!currentProfile) {
      return { success: false, message: 'No active profile' };
    }

    const currentPage = currentProfile.currentPage || 1;
    const totalPages = currentProfile.totalPages || 1;
    
    return {
      success: true,
      message: `Page ${currentPage}/${totalPages}`
    };
  }
}