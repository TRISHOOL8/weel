import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from '@/lib/types';

// A selection of commonly used icons. This list can be expanded.
export const iconList = [
  'Home', 'Settings', 'Play', 'Pause', 'Mic', 'Volume2', 'FileText', 'Folder', 
  'Code', 'Terminal', 'Camera', 'Video', 'MessageCircle', 'Users', 'Link', 
  'Zap', 'Lightbulb', 'Coffee', 'Github', 'Twitter', 'Youtube', 'Sun', 'Moon',
  'Command', 'Power', 'Bell', 'Search', 'Trash2', 'Edit3', 'PlusCircle', 'MinusCircle',
  'ChevronsLeft', 'ChevronsRight', 'ChevronsUp', 'ChevronsDown', 'RotateCcw', 'Copy', 'Save',
  // Added for actions sidebar
  'LayoutDashboard', 'HardDrive', 'Server', 'ToggleRight', 'AppWindow', 'XSquare', 'Type', 
  'PlaySquare', 'SlidersHorizontal', 'Rocket', 'StopCircle', 'List', 'Globe', 'Keyboard',
  'Timer', 'Volume', 'ExternalLink', 'FolderOpen', 'TerminalSquare',
  // Added for EditProfilesDialog
  'Edit2' 
] as const;

export type IconName = typeof iconList[number];

export const iconMap: Record<IconName, LucideIcon> = iconList.reduce((acc, name) => {
  const Component = (LucideIcons as any)[name] as LucideIcon | undefined;
  if (Component) {
    acc[name as IconName] = Component;
  } else {
    console.warn(`Icon "${name}" not found in lucide-react. Please check the name or add it if it's new.`);
    // Fallback to a default icon if needed, or handle missing icons gracefully
    acc[name as IconName] = LucideIcons.AlertCircle; // Example fallback
  }
  return acc;
}, {} as Record<IconName, LucideIcon>);

export function getLucideIcon(name?: string): LucideIcon | undefined {
  if (!name || !(name in iconMap)) {
    return undefined;
  }
  return iconMap[name as IconName];
}
