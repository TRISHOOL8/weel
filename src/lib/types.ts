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
  // Multi Action types
  | 'multi_action'
  | 'multi_action_switch'
  | 'random_action'
  // Navigation types
  | 'navigation_create_folder'
  | 'navigation_switch_profile'
  | 'navigation_previous_page'
  | 'navigation_next_page'
  | 'navigation_go_to_page'
  | 'navigation_page_indicator'
  // Volume Controller types
  | 'volume_control_input'
  | 'volume_control_output'
  // New comprehensive action types
  | 'website'
  | 'hotkey_switch'
  | 'open_application'
  | 'delay'
  | 'play_audio'
  | 'stop_audio'
  | 'countdown_timer'
  | 'create_folder'
  | 'switch_profile'
  | 'previous_page'
  | 'next_page'
  | 'go_to_page'
  | 'page_indicator';

export const ALL_ACTION_TYPES: ButtonActionType[] = [
  'none', 'open_url', 'run_script', 'hotkey', 'plugin', 
  'soundboard_play', 'soundboard_stop', 'timer', 'sleep', 
  'system_website', 'system_hotkey_switch', 'system_hotkey', 
  'system_open', 'system_open_app', 'system_close', 'system_text', 
  'system_multimedia', 'volume_control',
  'multi_action', 'multi_action_switch', 'random_action', 
  'navigation_create_folder', 'navigation_switch_profile', 
  'navigation_previous_page', 'navigation_next_page',
  'navigation_go_to_page', 'navigation_page_indicator', 
  'volume_control_input', 'volume_control_output',
  'website', 'hotkey_switch', 'open_application', 'delay',
  'play_audio', 'stop_audio', 'countdown_timer',
  'create_folder', 'switch_profile', 'previous_page', 
  'next_page', 'go_to_page', 'page_indicator'
];

export interface ActionStep {
  id: string;
  type: ButtonActionType;
  value: string;
  delay?: number; // milliseconds
  enabled?: boolean;
  name?: string;
  // Audio specific
  volume?: number;
  loop?: boolean;
  outputDevice?: string;
  // Timer specific
  duration?: number;
}

export interface ButtonAction {
  type: ButtonActionType;
  value: string; 
  name?: string;
  
  // Multi Action specific properties
  steps?: ActionStep[];
  
  // Multi Action Switch specific properties
  actionSets?: ActionStep[][];
  currentSetIndex?: number;
  
  // Random Action specific properties
  randomActions?: ActionStep[];
  
  // Timer specific properties
  duration?: number; // seconds
  showCountdown?: boolean;
  
  // Hotkey Switch specific properties
  primaryHotkey?: string;
  secondaryHotkey?: string;
  currentState?: 'primary' | 'secondary';
  
  // Audio specific properties
  volume?: number;
  loop?: boolean;
  outputDevice?: string;
  audioFile?: string;
  
  // Navigation specific properties
  targetProfile?: string;
  targetPage?: number;
  folderName?: string;
  folderButtons?: (ButtonConfig | null)[];
  
  // Page indicator properties
  currentPage?: number;
  totalPages?: number;
}

export interface ButtonConfig {
  id: string; 
  label: string;
  iconName?: IconName; 
  action: ButtonAction;
  backgroundColor?: string; 
  textColor?: string;
  
  // Timer display state
  timerState?: {
    isRunning: boolean;
    remainingTime: number;
    startTime: number;
  };
  
  // Folder state
  isFolder?: boolean;
  folderContents?: (ButtonConfig | null)[];
  parentFolder?: string;
  
  // Page state
  currentPage?: number;
  totalPages?: number;
}

export interface Profile {
  id: string;
  name: string;
  gridSize: { rows: number; cols: number };
  buttons: (ButtonConfig | null)[]; 
  currentPage?: number;
  totalPages?: number;
  parentProfile?: string; // For folder navigation
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

// Audio management
export interface AudioInstance {
  id: string;
  audio: HTMLAudioElement;
  buttonId: string;
}

// Timer management
export interface TimerInstance {
  id: string;
  buttonId: string;
  duration: number;
  startTime: number;
  interval: NodeJS.Timeout;
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
  
  // Audio management
  playAudio: (filePath: string, options?: { volume?: number; loop?: boolean; outputDevice?: string }) => Promise<{ success: boolean; audioId?: string; message: string }>;
  stopAudio: (audioId?: string) => Promise<{ success: boolean; message: string }>;
  
  // File system operations
  selectAudioFile: () => Promise<{ success: boolean; filePath?: string; message: string }>;
  selectFile: () => Promise<{ success: boolean; filePath?: string; message: string }>;
  selectFolder: () => Promise<{ success: boolean; folderPath?: string; message: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}