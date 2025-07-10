
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { IconName } from './icons';

// Define a more generic type for Lucide icons
export type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

export type ButtonActionType = 
  | 'none' 
  | 'open_url' 
  | 'run_script' 
  | 'hotkey' 
  | 'plugin' 
  | 'soundboard_play' 
  | 'soundboard_stop' 
  | 'timer' 
  | 'sleep' 
  | 'system_website' 
  | 'system_hotkey_switch' 
  | 'system_hotkey' 
  | 'system_open' 
  | 'system_open_app' 
  | 'system_close' 
  | 'system_text' 
  | 'system_multimedia' 
  | 'volume_control'
  // New action types
  | 'multi_action'
  | 'multi_action_switch'
  | 'random_action'
  | 'navigation_create_folder'
  | 'navigation_switch_profile'
  | 'navigation_previous_page'
  | 'navigation_next_page'
  | 'navigation_go_to_page'
  | 'navigation_page_indicator'
  | 'volume_control_input'
  | 'volume_control_output';

export const ALL_ACTION_TYPES: ButtonActionType[] = [
  'none', 'open_url', 'run_script', 'hotkey', 'plugin', 
  'soundboard_play', 'soundboard_stop', 'timer', 'sleep', 
  'system_website', 'system_hotkey_switch', 'system_hotkey', 
  'system_open', 'system_open_app', 'system_close', 'system_text', 
  'system_multimedia', 'volume_control',
  'multi_action', 'multi_action_switch', 'random_action', 'navigation_create_folder',
  'navigation_switch_profile', 'navigation_previous_page', 'navigation_next_page',
  'navigation_go_to_page', 'navigation_page_indicator', 'volume_control_input',
  'volume_control_output'
];

export interface ButtonAction {
  type: ButtonActionType;
  value: string; 
  name?: string; 
}

export interface ButtonConfig {
  id: string; 
  label: string;
  iconName?: IconName; 
  action: ButtonAction;
  backgroundColor?: string; 
  textColor?: string; 
}

export interface Profile {
  id: string;
  name: string;
  gridSize: { rows: number; cols: number };
  buttons: (ButtonConfig | null)[]; 
}

export interface SmartActionSuggestion {
  applicationName: string;
  commandSequence: string; 
}

export interface PredefinedActionItem {
  id: string; 
  name: string; 
  iconName: IconName;
  defaultConfig: Partial<ButtonConfig>; 
}

export interface PredefinedActionCategory {
  id: string; 
  name: string;
  iconName: IconName;
  actions: PredefinedActionItem[];
}

export interface InstalledApp {
  name: string;
  path: string;
  icon: string | null;
}

// For Electron IPC communication
export interface ElectronAPI {
  performAction: (actionDetails: ButtonAction & { name?: string }) => Promise<{ success: boolean; message: string }>;
  onHardwareButton: (callback: (buttonIndex: number) => void) => () => void;
  onESP32Status: (callback: (status: {connected: boolean; port?: string; error?: string}) => void) => () => void;
  loadProfiles: () => Promise<Profile[] | null>;
  saveProfiles: (profilesData: Profile[]) => Promise<{success: boolean; message?: string}>;
  getInstalledApps: () => Promise<InstalledApp[]>;
  sendRendererProfileStateUpdate: (data: { profiles: Profile[]; currentProfileId: string | null; }) => void;
  onSwitchProfileFromTray: (callback: (profileId: string) => void) => () => void;
  onRequestInitialProfileState: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
