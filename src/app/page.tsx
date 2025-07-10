
"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/header";
import { ConfigurationPanel } from "@/components/dashboard/configuration-panel";
import { SmartActionsDialog } from "@/components/dashboard/smart-actions-dialog";
import { ActionsSidebar } from "@/components/dashboard/actions-sidebar";
import { EditProfilesDialog } from "@/components/dashboard/edit-profiles-dialog";
import { PagesPanel } from "@/components/dashboard/pages-panel";
import type { Profile, ButtonConfig, PredefinedActionItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DndContext, pointerWithin, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type Active, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { InteractiveButtonDnd } from "@/components/dashboard/interactive-button-dnd";
import { DraggableActionItem } from "@/components/dashboard/draggable-action-item";
import { Loader2 } from "lucide-react";
import { ActionExecutor } from "@/lib/actions/action-executor";
import { AppAwareSwitchingHandler } from "@/lib/actions/app-aware-switching";
import type { ConfigureButtonAIOutput, ConfigureButtonAIInput } from "@/ai/flows/configure-button-ai-flow"; // Updated import

const initialDefaultProfileButtons: (ButtonConfig | null)[] = Array(3 * 3).fill(null);
initialDefaultProfileButtons[0] = { id: 'btn-sample-1', label: 'Google', iconName: 'Globe', action: { type: 'open_url', value: 'https://google.com' } };
initialDefaultProfileButtons[1] = { id: 'btn-sample-2', label: 'Code', iconName: 'Code', action: { type: 'system_open_app', value: 'Visual Studio Code' } };
initialDefaultProfileButtons[3] = { id: 'btn-sample-3', label: 'Settings Icon (No Action)', iconName: 'Settings', action: { type: 'none', value: '' } };

// Simplified default profiles to make new profile naming more intuitive
const defaultInitialProfiles: Profile[] = [
  {
    id: "default-profile-1",
    name: "My Weel Setup",
    gridSize: { rows: 3, cols: 3 },
    buttons: initialDefaultProfileButtons.slice(0, 9), // Ensure 9 buttons
    currentPage: 1,
    totalPages: 1,
    pages: { 1: initialDefaultProfileButtons.slice(0, 9) },
    pinnedPages: [1]
  }
];

export default function WeelPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesInitialized, setProfilesInitialized] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isSmartActionsDialogOpen, setIsSmartActionsDialogOpen] = useState(false);
  const [isEditProfilesDialogOpen, setIsEditProfilesDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const [esp32Status, setEsp32Status] = useState<{connected: boolean; port?: string; error?: string}>({ connected: false });
  const [isAppAwareSwitchingEnabled, setIsAppAwareSwitchingEnabled] = useState(false); // Feature flag for app-aware switching

  const { toast } = useToast();
  
  const handlePageChange = useCallback((pageNumber: number) => {
    if (!currentProfile) return;
    
    // Save current page buttons
    const currentPage = currentProfile.currentPage || 1;
    const updatedPages = {
      ...currentProfile.pages,
      [currentPage]: [...currentProfile.buttons]
    };
    
    // Load new page buttons
    const newPageButtons = updatedPages[pageNumber] || Array(currentProfile.gridSize.rows * currentProfile.gridSize.cols).fill(null);
    
    setProfiles(prevProfiles =>
      prevProfiles.map(p => 
        p.id === currentProfile.id 
          ? { 
              ...p, 
              currentPage: pageNumber,
              buttons: newPageButtons,
              pages: updatedPages
            }
          : p
      )
    );
    
    // Clear selection when changing pages
    setSelectedButtonIndex(null);
    setIsConfigPanelOpen(false);
    
    toast({ title: "Page Changed", description: `Switched to page ${pageNumber}` });
  }, [currentProfile, toast]);
  
  // Initialize action handlers safely
  const [actionExecutor] = useState(() => {
    try {
      return ActionExecutor.getInstance();
    } catch (error) {
      console.error('Failed to initialize ActionExecutor:', error);
      return null;
    }
  });
  
  const [appAwareSwitchingHandler] = useState(() => {
    try {
      return AppAwareSwitchingHandler.getInstance();
    } catch (error) {
      console.error('Failed to initialize AppAwareSwitchingHandler:', error);
      return null;
    }
  });

  // Effect for initial loading of profiles - runs once on mount
  useEffect(() => {
    setIsMounted(true);
    const loadStoredProfiles = async () => {
      let loadedProfiles: Profile[] | null = null;
      if (window.electronAPI?.loadProfiles) {
        try {
          loadedProfiles = await window.electronAPI.loadProfiles();
        } catch (error) {
          console.error("Failed to load profiles:", error);
          toast({ title: "Load Error", description: "Could not load saved profiles. Using defaults.", variant: "destructive" });
        }
      }

      const ensureGridConsistency = (profile: Profile): Profile => ({
        ...profile,
        gridSize: { rows: 3, cols: 3 }, // Enforce 3x3 grid
        buttons: (Array.isArray(profile.buttons) ? profile.buttons : Array(3 * 3).fill(null)).slice(0, 9), // Ensure 9 buttons, pad if necessary
      });

      if (loadedProfiles && loadedProfiles.length > 0) {
        const fixedProfiles = loadedProfiles.map(ensureGridConsistency);
        setProfiles(fixedProfiles);
        if (!currentProfileId && fixedProfiles[0]) {
          setCurrentProfileId(fixedProfiles[0].id);
        }
      } else {
        const fixedDefaultProfiles = defaultInitialProfiles.map(ensureGridConsistency);
        setProfiles(fixedDefaultProfiles);
        if (!currentProfileId && fixedDefaultProfiles.length > 0) { // Check fixedDefaultProfiles specifically
          setCurrentProfileId(fixedDefaultProfiles[0].id);
        }
      }
      setProfilesInitialized(true);
    };

    loadStoredProfiles();
  }, [toast]); // Dependency: toast (runs once effectively)

  // Effect for saving profiles
  useEffect(() => {
    if (!profilesInitialized || !isMounted) { // Only save if initialized and mounted
      return;
    }
    if (profiles.length > 0 && window.electronAPI?.saveProfiles) {
      window.electronAPI.saveProfiles(profiles)
        .then(result => {
          if (result.success) {
            if (window.electronAPI?.sendRendererProfileStateUpdate) {
              window.electronAPI.sendRendererProfileStateUpdate({ profiles, currentProfileId });
            }
          } else {
            console.error("Failed to save profiles via Electron API:", result.message);
            toast({ title: "Save Error", description: `Could not save profiles: ${result.message}`, variant: "destructive" });
          }
        })
        .catch(error => {
          console.error("Error calling saveProfiles Electron API:", error);
          toast({ title: "Save Error", description: "Failed to save profiles due to an API error.", variant: "destructive" });
        });
    }
  }, [profiles, currentProfileId, profilesInitialized, isMounted, toast]); // Added currentProfileId and isMounted

  const currentProfile = profiles.find(p => p.id === currentProfileId);

  const executeButtonAction = useCallback(async (buttonConfig: ButtonConfig | null) => {
    if (!buttonConfig || !buttonConfig.action || buttonConfig.action.type === 'none') {
      if (buttonConfig?.action?.type !== 'none') {
        toast({
          title: "No Action",
          description: `Button "${buttonConfig?.label || 'Unnamed'}" has no action defined or is a 'none' type.`,
        });
      }
      return;
    }

    try {
      if (!actionExecutor) {
        // Fallback to basic action execution
        if (window.electronAPI?.performAction) {
          const result = await window.electronAPI.performAction({
            ...buttonConfig.action,
            name: buttonConfig.label || 'Unnamed Action'
          });
          if (result.success && buttonConfig.action.type !== 'none') {
            toast({ title: "Action Triggered", description: result.message });
          } else if (!result.success) {
            toast({ title: "Action Failed", description: result.message, variant: "destructive" });
          }
          return;
        } else if (buttonConfig.action.type === 'open_url') {
          window.open(buttonConfig.action.value, '_blank');
          toast({ title: "URL Opened", description: `Opened ${buttonConfig.action.value}` });
          return;
        } else {
          toast({ title: "Action Not Available", description: "Action system not initialized", variant: "destructive" });
          return;
        }
      }
      
      const result = await actionExecutor.executeAction(
        buttonConfig.action,
        buttonConfig.id,
        {
          currentProfile,
          profiles,
          onProfileChange: handleProfileChange,
          onCreateProfile: handleCreateProfile,
          updateProfile: (profileId, updates) => {
            setProfiles(prevProfiles =>
              prevProfiles.map(p => (p.id === profileId ? { ...p, ...updates } : p))
            );
          },
          updateButton: (buttonId, updates) => {
            setProfiles(prevProfiles =>
              prevProfiles.map(profile => ({
                ...profile,
                buttons: profile.buttons.map(btn => 
                  btn?.id === buttonId ? { ...btn, ...updates } : btn
                )
              }))
            );
          },
          updateAction: (updatedAction) => {
            setProfiles(prevProfiles =>
              prevProfiles.map(profile => ({
                ...profile,
                buttons: profile.buttons.map(btn => 
                  btn?.id === buttonConfig.id ? { ...btn, action: updatedAction } : btn
                )
              }))
            );
          }
        }
      );

      if (result.success && buttonConfig.action.type !== 'none') {
        toast({ title: "Action Triggered", description: result.message });
      } else if (!result.success) {
        toast({ title: "Action Failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Action Error",
        description: `Failed to execute action: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleHardwareButtonPress = useCallback((buttonIndex: number) => {
    const activeProfile = profiles.find(p => p.id === currentProfileId);
    if (activeProfile && activeProfile.buttons[buttonIndex] !== undefined) {
      const buttonConfig = activeProfile.buttons[buttonIndex];
      if (buttonConfig) {
        toast({ title: "Weel Trigger", description: `Executing: "${buttonConfig.label || `Button ${buttonIndex + 1}`}"` });
        executeButtonAction(buttonConfig);
      } else {
        toast({ title: "Weel Trigger", description: `Button ${buttonIndex + 1} pressed, but it's an empty slot.` });
      }
    } else {
      toast({ title: "Weel Trigger", description: `Button ${buttonIndex + 1} pressed, but no button or slot configured.` });
    }
  }, [profiles, currentProfileId, executeButtonAction, toast]);

  useEffect(() => {
    if (window.electronAPI?.onHardwareButton) {
      const unsubscribe = window.electronAPI.onHardwareButton(handleHardwareButtonPress);
      return () => unsubscribe();
    }
  }, [handleHardwareButtonPress]);

  useEffect(() => {
    if (window.electronAPI?.onESP32Status) {
      const unsubscribe = window.electronAPI.onESP32Status((status) => {
        setEsp32Status(status);
        if (status.connected && (!esp32Status.connected || !isMounted) ) {
          toast({ title: "Hardware Connected", description: `Weel connected on ${status.port}` });
        } else if (status.error && (esp32Status.connected || !isMounted)) {
          toast({ title: "Hardware Connection Error", description: `Weel error: ${status.error}. Will retry.`, variant: "destructive" });
        } else if (!status.connected && esp32Status.connected) {
          toast({ title: "Hardware Disconnected", description: "Weel connection lost. Will retry.", variant: "destructive" });
        }
      });
      return () => unsubscribe();
    }
  }, [isMounted, toast, esp32Status.connected]);

  const handleProfileChange = useCallback((profileId: string) => {
    const profileExists = profiles.some(p => p.id === profileId);
    if (profileExists) {
        setCurrentProfileId(profileId);
        setSelectedButtonIndex(null);
        setIsConfigPanelOpen(false);
        const newProfileName = profiles.find(p=>p.id === profileId)?.name || "Unknown Profile";
        toast({title: "Profile Changed", description: `Switched to ${newProfileName}`});
    } else {
        toast({title: "Profile Change Error", description: `Profile ID ${profileId} not found.`, variant: "destructive"});
    }
  }, [profiles, toast]);

  const handleCreateProfile = useCallback((name?: string) => {
    const newProfileId = `profile-${Date.now()}`;
    const newProfileName = name || `New Profile ${profiles.length + 1}`;
    const newProfile: Profile = {
      id: newProfileId,
      name: newProfileName,
      gridSize: { rows: 3, cols: 3 },
      buttons: Array(3 * 3).fill(null),
      currentPage: 1,
      totalPages: 1,
      pages: { 1: Array(3 * 3).fill(null) },
      pinnedPages: [1]
    };
    setProfiles(prevProfiles => [...prevProfiles, newProfile]);
    setCurrentProfileId(newProfileId); // Make the new profile active
    toast({ title: "Profile Created", description: `Switched to ${newProfile.name}.` });
    return newProfileId; // Return new profile ID for AI handler
  }, [profiles, toast]); // Ensure dependencies are correct

  // Effect for app-aware switching
  useEffect(() => {
    if (!isAppAwareSwitchingEnabled || !currentProfile || !appAwareSwitchingHandler) return;

    appAwareSwitchingHandler.initialize();
    
    const unsubscribe = appAwareSwitchingHandler.addAppChangeListener((appName) => {
      const currentPage = currentProfile.currentPage || 1;
      const switchResult = appAwareSwitchingHandler.shouldSwitchPage(
        appName, 
        currentProfile, 
        currentPage
      );

      if (switchResult.shouldSwitch && switchResult.targetPage) {
        handlePageChange(switchResult.targetPage);
        toast({
          title: "Auto-switched Page",
          description: `Switched to page ${switchResult.targetPage} for ${appName}`,
        });
      }
    });

    return unsubscribe;
  }, [isAppAwareSwitchingEnabled, currentProfile, handlePageChange, toast, appAwareSwitchingHandler]);

  // Update profile with app-aware settings when toggling
  useEffect(() => {
    if (!currentProfile || !appAwareSwitchingHandler) return;
    
    const updatedProfile = appAwareSwitchingHandler.toggleAppAwareSwitching(
      currentProfile, 
      isAppAwareSwitchingEnabled
    );
    
    if (updatedProfile.appAwareSettings?.enabled !== currentProfile.appAwareSettings?.enabled) {
      setProfiles(prevProfiles =>
        prevProfiles.map(p => (p.id === currentProfile.id ? updatedProfile : p))
      );
    }
  }, [isAppAwareSwitchingEnabled, currentProfile, appAwareSwitchingHandler]);

  const handleEditProfilesClick = () => setIsEditProfilesDialogOpen(true);

  const handleRenameProfile = (profileId: string, newName: string) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(p => (p.id === profileId ? { ...p, name: newName } : p))
    );
    toast({ title: "Profile Renamed", description: `Profile updated to "${newName}".` });
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
      toast({ title: "Cannot Delete", description: "You cannot delete the last profile.", variant: "destructive" });
      return;
    }
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) return;

    let newCurrentId = currentProfileId;
    if (currentProfileId === profileId) {
      const remainingProfiles = profiles.filter(p => p.id !== profileId);
      newCurrentId = remainingProfiles.length > 0 ? remainingProfiles[0].id : null;
    }
    
    setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
    setCurrentProfileId(newCurrentId);
    toast({ title: "Profile Deleted", description: `Profile "${profileToDelete.name}" has been deleted.` });
  };

  const canDeleteProfile = (profileId: string): boolean => profiles.length > 1;

  const handleUIButtonClick = (index: number) => {
    const buttonConfig = currentProfile?.buttons[index];
    if (buttonConfig) {
      setSelectedButtonIndex(index);
      setIsConfigPanelOpen(true);
    }
    // If the slot is empty, do nothing on click.
    // Configuration happens via drag-and-drop.
  };

  const handleSaveButtonConfig = (index: number, config: ButtonConfig, targetProfileId?: string) => {
    const profileIdToUpdate = targetProfileId || currentProfileId;
    if (!profileIdToUpdate) return;

    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id === profileIdToUpdate) {
          const updatedButtons = [...p.buttons];
          const existingButton = updatedButtons[index];
          const isTrulyExistingUserButton = existingButton?.id && !existingButton.id.startsWith('btn-sample-') && !existingButton.id.startsWith('predefined-') && !existingButton.id.startsWith('btn-ai-');
          const newButtonId = (isTrulyExistingUserButton && config.id === existingButton.id) ? existingButton.id : (config.id && (config.id.startsWith('predefined-') || config.id.startsWith('btn-ai-')) && existingButton?.id === config.id) ? config.id : `btn-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
          updatedButtons[index] = { ...config, id: newButtonId };
          return { ...p, buttons: updatedButtons };
        }
        return p;
      })
    );
    // Toast is handled by the calling function if multiple buttons are added, or here if single
    if (!targetProfileId) { // Only toast for direct saves, not AI multi-adds
        toast({ title: "Button Saved", description: `Configuration for button ${index + 1} updated.` });
    }
  };

  const handleDeleteButtonConfig = (index: number) => {
    const activeProfile = profiles.find(p => p.id === currentProfileId);
    if (!activeProfile) return;
    const updatedButtons = [...activeProfile.buttons];
    updatedButtons[index] = null;
    setProfiles(prevProfiles =>
      prevProfiles.map(p => (p.id === currentProfileId ? { ...p, buttons: updatedButtons } : p))
    );
    toast({ title: "Button Cleared", description: `Button ${index + 1} configuration removed.` });
    setIsConfigPanelOpen(false);
    setSelectedButtonIndex(null);
  };

  const handleAddPage = useCallback(() => {
    if (!currentProfile) return;
    
    const newPageNumber = (currentProfile.totalPages || 1) + 1;
    const currentPage = currentProfile.currentPage || 1;
    
    // Save current page buttons
    const updatedPages = {
      ...currentProfile.pages,
      [currentPage]: [...currentProfile.buttons],
      [newPageNumber]: Array(currentProfile.gridSize.rows * currentProfile.gridSize.cols).fill(null)
    };
    
    setProfiles(prevProfiles =>
      prevProfiles.map(p => 
        p.id === currentProfile.id 
          ? { 
              ...p, 
              totalPages: newPageNumber,
              pages: updatedPages
            }
          : p
      )
    );
    
    toast({ title: "Page Added", description: `Page ${newPageNumber} created` });
  }, [currentProfile, toast]);

  const handleDeletePage = useCallback((pageNumber: number) => {
    if (!currentProfile || (currentProfile.totalPages || 1) <= 1) return;
    
    const currentPage = currentProfile.currentPage || 1;
    const totalPages = currentProfile.totalPages || 1;
    const pinnedPages = currentProfile.pinnedPages || [1];
    
    // Don't delete pinned pages
    if (pinnedPages.includes(pageNumber)) {
      toast({ title: "Cannot Delete", description: "Cannot delete a pinned page", variant: "destructive" });
      return;
    }
    
    // Create new pages object without the deleted page
    const updatedPages = { ...currentProfile.pages };
    delete updatedPages[pageNumber];
    
    // Renumber pages to fill gaps
    const sortedPageNumbers = Object.keys(updatedPages)
      .map(Number)
      .sort((a, b) => a - b);
    
    const renumberedPages: { [key: number]: (ButtonConfig | null)[] } = {};
    sortedPageNumbers.forEach((oldPageNum, index) => {
      renumberedPages[index + 1] = updatedPages[oldPageNum];
    });
    
    // Determine new current page
    let newCurrentPage = currentPage;
    if (pageNumber === currentPage) {
      newCurrentPage = Math.min(currentPage, totalPages - 1);
    } else if (pageNumber < currentPage) {
      newCurrentPage = currentPage - 1;
    }
    
    // Load buttons for new current page
    const newPageButtons = renumberedPages[newCurrentPage] || Array(currentProfile.gridSize.rows * currentProfile.gridSize.cols).fill(null);
    
    setProfiles(prevProfiles =>
      prevProfiles.map(p => 
        p.id === currentProfile.id 
          ? { 
              ...p, 
              totalPages: totalPages - 1,
              currentPage: newCurrentPage,
              buttons: newPageButtons,
              pages: renumberedPages,
              pinnedPages: pinnedPages.map(pin => pin > pageNumber ? pin - 1 : pin).filter(pin => pin <= totalPages - 1)
            }
          : p
      )
    );
    
    toast({ title: "Page Deleted", description: `Page ${pageNumber} has been deleted` });
  }, [currentProfile, toast]);

  const handlePinPage = useCallback((pageNumber: number, pinned: boolean) => {
    if (!currentProfile) return;
    
    const currentPinnedPages = currentProfile.pinnedPages || [1];
    let updatedPinnedPages: number[];
    
    if (pinned) {
      updatedPinnedPages = [...currentPinnedPages, pageNumber];
    } else {
      updatedPinnedPages = currentPinnedPages.filter(p => p !== pageNumber);
    }
    
    setProfiles(prevProfiles =>
      prevProfiles.map(p => 
        p.id === currentProfile.id 
          ? { ...p, pinnedPages: updatedPinnedPages }
          : p
      )
    );
    
    toast({ 
      title: pinned ? "Page Pinned" : "Page Unpinned", 
      description: `Page ${pageNumber} ${pinned ? 'pinned' : 'unpinned'}` 
    });
  }, [currentProfile, toast]);

  const handleAIConfigurationResult = (aiOutput: ConfigureButtonAIOutput) => {
    let activeProfileId = currentProfileId;
    let profileCreatedMessage = "";

    if (aiOutput.createdProfileName) {
      const newProfId = handleCreateProfile(aiOutput.createdProfileName);
      activeProfileId = newProfId; // Switch to the new profile for button adding
      profileCreatedMessage = `Profile "${aiOutput.createdProfileName}" created. `;
    }
    
    if (!activeProfileId) { // Should ideally not happen if createProfile works or currentProfileId is set
        toast({ title: "AI Error", description: "No active profile to add buttons to. Please select or create one.", variant: "destructive"});
        setIsSmartActionsDialogOpen(true); // Keep dialog open if error
        return;
    }

    let buttonsAddedCount = 0;
    if (aiOutput.buttonConfigs && aiOutput.buttonConfigs.length > 0) {
      // We need to update the profiles state in a way that React recognizes for the *target* profile.
      setProfiles(prevProfiles => {
        return prevProfiles.map(p => {
          if (p.id === activeProfileId) {
            let currentButtons = [...p.buttons]; // Make a mutable copy of this profile's buttons
            aiOutput.buttonConfigs!.forEach(btnConfig => {
              const emptySlotIndex = currentButtons.findIndex(btn => btn === null);
              if (emptySlotIndex !== -1) {
                const newButtonId = `btn-ai-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
                const newButton: ButtonConfig = { ...btnConfig, id: newButtonId };
                currentButtons[emptySlotIndex] = newButton;
                buttonsAddedCount++;
              }
            });
            return { ...p, buttons: currentButtons }; // Return the profile with updated buttons
          }
          return p; // Return other profiles unchanged
        });
      });
    }

    let finalMessage = profileCreatedMessage;
    const targetProfileName = profiles.find(p=>p.id === activeProfileId)?.name || "the current profile";

    if (buttonsAddedCount > 0) {
      finalMessage += `${buttonsAddedCount} button(s) configured for profile "${targetProfileName}".`;
    } else if (!profileCreatedMessage && aiOutput.buttonConfigs && aiOutput.buttonConfigs.length > 0) {
      finalMessage = `No empty slots in profile "${targetProfileName}" to add all AI suggested buttons.`;
    } else if (!profileCreatedMessage && (!aiOutput.buttonConfigs || aiOutput.buttonConfigs.length === 0)) {
      finalMessage = aiOutput.messageForUser || "AI processed the request.";
    }
    
    toast({ title: "AI Assistant", description: finalMessage });
    setIsSmartActionsDialogOpen(false); // Close dialog on successful processing or if no buttons to add
  };


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const dndItems = currentProfile
    ? currentProfile.buttons.map((btn, idx) => ({
        id: btn?.id || `empty-${idx}-${currentProfile.id}`,
        index: idx,
        config: btn
      }))
    : [];

  const handleDragStart = (event: DragStartEvent) => setActiveDragItem(event.active);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!currentProfile || !active || !over) return;

    const activeIsPredefinedAction = active.data.current?.type === 'PREDEFINED_ACTION';
    const overItemData = dndItems.find(item => item.id === over.id);
    const overItemIndex = overItemData?.index;

    if (overItemIndex === undefined || overItemIndex === -1) return;

    if (activeIsPredefinedAction) {
      if (active.data.current?.actionConfig) {
        const predefinedConfig = active.data.current.actionConfig as Partial<ButtonConfig>;
        const newConfig: ButtonConfig = {
          id: `predefined-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
          label: predefinedConfig.label || "New Action",
          iconName: predefinedConfig.iconName,
          action: predefinedConfig.action || { type: 'none', value: '' },
          backgroundColor: predefinedConfig.backgroundColor,
          textColor: predefinedConfig.textColor,
        };
        handleSaveButtonConfig(overItemIndex, newConfig, currentProfile.id);
        toast({ title: "Action Added", description: `${newConfig.label || 'Action'} added to button ${overItemIndex + 1}.` });
      }
    } else {
      if (active.id === over.id) return; // Item dropped on itself
      const activeItemData = dndItems.find(item => item.id === active.id);
      const activeItemIndex = activeItemData?.index;

      if (activeItemIndex !== undefined && activeItemIndex !== -1 && overItemIndex !== undefined && overItemIndex !== -1) {
        if (activeItemIndex !== overItemIndex) {
          const updatedButtons = arrayMove(currentProfile.buttons, activeItemIndex, overItemIndex);
          setProfiles(prevProfiles =>
            prevProfiles.map(p =>
              p.id === currentProfileId ? { ...p, buttons: updatedButtons } : p
            )
          );
          if (selectedButtonIndex === activeItemIndex || selectedButtonIndex === overItemIndex) {
            setIsConfigPanelOpen(false);
            setSelectedButtonIndex(null);
          }
          toast({ title: "Button Moved", description: "Button position updated." });
        }
      }
    }
  };

  // Effect for Tray IPC - Sending updates to main
  useEffect(() => {
    if (!isMounted || !profilesInitialized) return;
    if (window.electronAPI?.sendRendererProfileStateUpdate) {
      window.electronAPI.sendRendererProfileStateUpdate({ profiles, currentProfileId });
    }
  }, [profiles, currentProfileId, profilesInitialized, isMounted]);

  // Effect for Tray IPC - Receiving 'switch-profile-from-tray'
  useEffect(() => {
    if (!isMounted) return;
    if (window.electronAPI?.onSwitchProfileFromTray) {
      const unsubscribe = window.electronAPI.onSwitchProfileFromTray((profileId: string) => {
        handleProfileChange(profileId); // Use existing handler
      });
      return () => unsubscribe();
    }
  }, [isMounted, handleProfileChange, toast]); // handleProfileChange is stable due to useCallback

   // Effect for Tray IPC - Responding to 'request-initial-profile-state'
   useEffect(() => {
    if (!isMounted) return;
    if (window.electronAPI?.onRequestInitialProfileState) {
        const unsubscribe = window.electronAPI.onRequestInitialProfileState(() => {
            if (profilesInitialized && window.electronAPI?.sendRendererProfileStateUpdate) {
                window.electronAPI.sendRendererProfileStateUpdate({ profiles, currentProfileId });
            }
        });
        return () => unsubscribe();
    }
   }, [isMounted, profilesInitialized, profiles, currentProfileId]); // Ensure all dependencies are listed


  if (!isMounted || !profilesInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        Loading Weel...
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <AppHeader
          profiles={profiles}
          currentProfileId={currentProfileId}
          onProfileChange={handleProfileChange}
          onCreateProfile={() => handleCreateProfile()} // Pass a function that calls handleCreateProfile
          onEditProfilesClick={handleEditProfilesClick}
          onSmartActionsClick={() => setIsSmartActionsDialogOpen(true)}
          currentUser={currentUser}
          authLoading={authLoading}
          esp32Status={esp32Status}
          isAppAwareSwitchingEnabled={isAppAwareSwitchingEnabled}
          onToggleAppAwareSwitching={setIsAppAwareSwitchingEnabled}
        />
        <div className="relative z-10 flex flex-1 overflow-hidden">
          <ActionsSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col items-center overflow-y-auto">
            {currentProfile ? (
              <div className="flex flex-col items-center">
                <SortableContext items={dndItems.map(item => item.id)} strategy={rectSortingStrategy}>
                  <div
                    className="grid gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-lg shadow-xl mt-8"
                    style={{
                      gridTemplateColumns: `repeat(${currentProfile.gridSize.cols}, minmax(90px, 130px))`,
                      gridTemplateRows: `repeat(${currentProfile.gridSize.rows}, minmax(90px, 130px))`,
                      aspectRatio: `${currentProfile.gridSize.cols} / ${currentProfile.gridSize.rows}`,
                    }}
                    data-ai-hint="control panel main grid droppable"
                  >
                    {dndItems.map((item) => (
                       <InteractiveButtonDnd
                        key={item.id}
                        id={item.id}
                        config={item.config}
                        onClick={() => handleUIButtonClick(item.index)}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                {/* Pages Panel - positioned below the grid */}
                <PagesPanel
                  currentProfile={currentProfile}
                  onPageChange={handlePageChange}
                  onAddPage={handleAddPage}
                  onDeletePage={handleDeletePage}
                  onPinPage={handlePinPage}
                  isAppAwareSwitchingEnabled={isAppAwareSwitchingEnabled}
                />
                </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                 Create a profile to get started or select an existing one.
              </div>
            )}
          </main>
        </div>

        {selectedButtonIndex !== null && currentProfile && (currentProfile.buttons[selectedButtonIndex] !== undefined || isConfigPanelOpen ) && (
          <ConfigurationPanel
            isOpen={isConfigPanelOpen}
            onOpenChange={setIsConfigPanelOpen}
            buttonConfig={currentProfile.buttons[selectedButtonIndex] || null}
            buttonIndex={selectedButtonIndex}
            onSave={(index, config) => handleSaveButtonConfig(index, config, currentProfile?.id)}
            onDelete={handleDeleteButtonConfig}
          />
        )}

        <SmartActionsDialog
          isOpen={isSmartActionsDialogOpen}
          onOpenChange={setIsSmartActionsDialogOpen}
          onAIConfigurationResult={handleAIConfigurationResult} // Updated prop name
        />

        <EditProfilesDialog
          isOpen={isEditProfilesDialogOpen}
          onOpenChange={setIsEditProfilesDialogOpen}
          profiles={profiles}
          onRenameProfile={handleRenameProfile}
          onDeleteProfile={handleDeleteProfile}
          canDeleteProfile={canDeleteProfile}
        />

      </div>
      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          activeDragItem.data.current?.type === 'PREDEFINED_ACTION' && activeDragItem.data.current?.predefinedActionItem ? (
            <DraggableActionItem
              actionItem={activeDragItem.data.current.predefinedActionItem as PredefinedActionItem}
              isOverlay={true}
            />
          ) : activeDragItem.data.current?.config || activeDragItem.data.current?.config === null ? (
            <InteractiveButtonDnd
              id={activeDragItem.id}
              config={activeDragItem.data.current.config as ButtonConfig | null}
              onClick={() => {}} // Overlay buttons don't execute actions
              isOverlay={true}
              className="shadow-2xl ring-2 ring-primary scale-105"
            />
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
