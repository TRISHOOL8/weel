import type { PredefinedActionCategory, ButtonAction } from "@/lib/types";
import type { IconName } from "@/lib/icons";

const createAction = (name: string, icon: IconName, actionType: ButtonAction['type'], actionValue: string = "", additionalProps?: Partial<ButtonAction>) => ({
  id: `action-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  iconName: icon,
  defaultConfig: {
    label: name,
    iconName: icon,
    action: { 
      type: actionType, 
      value: actionValue,
      ...additionalProps
    },
  },
});

export const predefinedActionCategories: PredefinedActionCategory[] = [
  {
    id: "category-multi-action",
    name: "Multi Action",
    iconName: "Zap",
    actions: [
      createAction("Multi Action", "PlusCircle", "multi_action", "", {
        steps: [
          { id: "step-1", type: "delay", value: "1000", enabled: true, name: "Wait 1 second" },
          { id: "step-2", type: "hotkey", value: "Ctrl+C", enabled: true, name: "Copy" }
        ]
      }),
      createAction("Multi Action Switch", "ToggleRight", "multi_action_switch", "", {
        actionSets: [
          [{ id: "set1-step1", type: "hotkey", value: "Ctrl+M", enabled: true, name: "Mute" }],
          [{ id: "set2-step1", type: "hotkey", value: "Ctrl+U", enabled: true, name: "Unmute" }]
        ],
        currentSetIndex: 0
      }),
      createAction("Random Action", "RotateCcw", "random_action", "", {
        randomActions: [
          { id: "random-1", type: "play_audio", value: "sound1.mp3", enabled: true, name: "Sound 1" },
          { id: "random-2", type: "play_audio", value: "sound2.mp3", enabled: true, name: "Sound 2" },
          { id: "random-3", type: "play_audio", value: "sound3.mp3", enabled: true, name: "Sound 3" }
        ]
      }),
    ],
  },
  {
    id: "category-navigation",
    name: "Navigation",
    iconName: "ChevronsRight",
    actions: [
      createAction("Create Folder", "FolderOpen", "create_folder", "New Folder", {
        folderName: "New Folder"
      }),
      createAction("Switch Profile", "Users", "switch_profile", "", {
        targetProfile: ""
      }),
      createAction("Previous Page", "ChevronsLeft", "previous_page"),
      createAction("Next Page", "ChevronsRight", "next_page"),
      createAction("Go to Page", "ExternalLink", "go_to_page", "1", {
        targetPage: 1
      }),
      createAction("Page Indicator", "List", "page_indicator"),
    ],
  },
  {
    id: "category-soundboard",
    name: "Soundboard",
    iconName: "Volume2",
    actions: [
      createAction("Play Audio", "Play", "play_audio", "", {
        audioFile: "",
        volume: 1.0,
        loop: false
      }),
      createAction("Stop Audio", "StopCircle", "stop_audio", "all"),
    ],
  },
  {
    id: "category-weel",
    name: "Weel Actions",
    iconName: "LayoutDashboard",
    actions: [
      createAction("Countdown Timer", "Timer", "countdown_timer", "60", {
        duration: 60,
        showCountdown: true
      }),
      createAction("Delay/Sleep", "Moon", "delay", "1000"),
    ],
  },
  {
    id: "category-system",
    name: "System",
    iconName: "HardDrive",
    actions: [
      createAction("Website", "Globe", "website", "https://example.com"),
      createAction("Hotkey Switch", "ToggleRight", "hotkey_switch", "Ctrl+M", {
        primaryHotkey: "Ctrl+M",
        secondaryHotkey: "Ctrl+U",
        currentState: "primary"
      }),
      createAction("Hotkey", "Keyboard", "hotkey", "Ctrl+Shift+A"),
      createAction("Open File/Folder", "Rocket", "system_open", "/path/to/item"),
      createAction("Open Application", "AppWindow", "open_application", ""),
      createAction("Close Application", "XSquare", "system_close", "AppName"),
      createAction("Type Text", "Type", "system_text", "Hello, World!"),
      createAction("Multimedia Control", "PlaySquare", "system_multimedia", "play_pause"),
    ],
  },
  {
    id: "category-volume-controller",
    name: "Volume Controller",
    iconName: "Volume",
    actions: [
      createAction("Volume Up", "Volume2", "volume_control", "increase"),
      createAction("Volume Down", "Volume", "volume_control", "decrease"),
      createAction("Mute Toggle", "Volume", "volume_control", "mute_toggle"),
      createAction("Input Device Control", "Mic", "volume_control_input", "mute_toggle"),
      createAction("Output Device Control", "Volume2", "volume_control_output", "increase"),
    ],
  },
];