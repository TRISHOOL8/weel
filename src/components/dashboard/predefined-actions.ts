import type { PredefinedActionCategory, ButtonAction } from "@/lib/types";
import type { IconName } from "@/lib/icons";

const createAction = (name: string, icon: IconName, actionType: ButtonAction['type'], actionValue: string = "") => ({
  id: `action-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  iconName: icon,
  defaultConfig: {
    label: name,
    iconName: icon,
    action: { type: actionType, value: actionValue },
  },
});

export const predefinedActionCategories: PredefinedActionCategory[] = [
  {
    id: "category-multi-action",
    name: "Multi Action",
    iconName: "Zap",
    actions: [
      createAction("Multi Action", "PlusCircle", "multi_action"),
      createAction("Multi Action Switch", "ToggleRight", "multi_action_switch"),
      createAction("Random Action", "RotateCcw", "random_action"),
    ],
  },
  {
    id: "category-navigation",
    name: "Navigation",
    iconName: "ChevronsRight",
    actions: [
      createAction("Create Folder", "FolderOpen", "navigation_create_folder"),
      createAction("Switch Profile", "Users", "navigation_switch_profile"),
      createAction("Previous Page", "ChevronsLeft", "navigation_previous_page"),
      createAction("Next Page", "ChevronsRight", "navigation_next_page"),
      createAction("Go to Page", "ExternalLink", "navigation_go_to_page"),
      createAction("Page Indicator", "List", "navigation_page_indicator"),
    ],
  },
  {
    id: "category-soundboard",
    name: "Soundboard",
    iconName: "Volume2",
    actions: [
      createAction("Play Audio", "Play", "soundboard_play", "path/to/audio.mp3"),
      createAction("Stop Audio", "StopCircle", "soundboard_stop"),
    ],
  },
  {
    id: "category-weel",
    name: "Weel Actions",
    iconName: "LayoutDashboard",
    actions: [
      createAction("Timer", "Timer", "timer", "00:05:00"),
      createAction("Sleep", "Moon", "sleep"),
    ],
  },
  {
    id: "category-system",
    name: "System",
    iconName: "HardDrive",
    actions: [
      createAction("Website", "Globe", "open_url", "https://example.com"),
      createAction("Hotkey Switch", "ToggleRight", "system_hotkey_switch"),
      createAction("Hotkey", "Keyboard", "hotkey", "Ctrl+Shift+A"),
      createAction("Open", "Rocket", "system_open", "/path/to/item"),
      createAction("Open Application", "AppWindow", "system_open_app", "AppName"),
      createAction("Close", "XSquare", "system_close", "AppName"),
      createAction("Text", "Type", "system_text", "Hello, World!"),
      createAction("Multimedia", "PlaySquare", "system_multimedia", "play_pause"),
    ],
  },
  {
    id: "category-volume-controller",
    name: "Volume Controller",
    iconName: "Volume",
    actions: [
      createAction("Input Device Control", "Mic", "volume_control_input"),
      createAction("Output Device Control", "Volume2", "volume_control_output"),
    ],
  },
];
