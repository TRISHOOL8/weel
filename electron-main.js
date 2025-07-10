const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, dialog } = require('electron');
const os = require('os');
const path = require('path');
const noble = require('@abandonware/noble');
let isDev;

const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;
let tray = null;

// Store profiles and current ID for tray menu
let lastKnownProfilesForTray = [];
let lastKnownCurrentProfileIdForTray = null;

const PROFILES_FILE_NAME = 'weel-profiles.json';
let profilesFilePath = '';

function getProfilesFilePath() {
  if (!profilesFilePath) {
    profilesFilePath = path.join(app.getPath('userData'), PROFILES_FILE_NAME);
  }
  return profilesFilePath;
}

async function loadProfilesFromFile() {
  try {
    const filePath = getProfilesFilePath();
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const profiles = JSON.parse(fileData);
      console.log('Profiles loaded from:', filePath);
      return profiles;
    }
    console.log('Profiles file not found, will use defaults:', filePath);
    return null; // Return null if file not found, consistent with error case
  } catch (error) {
    console.error('Error loading profiles from file:', error);
    return null;
  }
}

async function saveProfilesToFile(profilesData) {
  try {
    const filePath = getProfilesFilePath();
    // Ensure directory exists before writing
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('User data directory created:', dirPath);
    }
    fs.writeFileSync(filePath, JSON.stringify(profilesData, null, 2), 'utf-8');
    console.log('Profiles saved to:', filePath);
    return { success: true };
  } catch (error) {
    console.error('Error saving profiles to file:', error);
    return { success: false, message: error.message };
  }
}

function showMainWindow() {
  console.log("showMainWindow called.");
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log("mainWindow is null or destroyed in showMainWindow. Re-creating...");
    createWindow(); // This will create and then the 'ready-to-show' or direct show should handle visibility.
    if (mainWindow) {
      // If createWindow doesn't show it immediately, or if it was created hidden
       if (!mainWindow.isVisible()) { // Ensure it's shown if created hidden
            mainWindow.show();
       }
       mainWindow.focus();
       if (process.platform === 'darwin') app.dock.show();
    } else {
      console.error("Failed to re-create/show mainWindow.");
    }
    return;
  }

  if (!mainWindow.isVisible()) {
    console.log("mainWindow exists but is not visible. Showing.");
    mainWindow.show();
  }
  mainWindow.focus();
  if (process.platform === 'darwin') app.dock.show();
}


function buildTrayContextMenu() {
  console.log("Building tray context menu with profiles:", lastKnownProfilesForTray, "current:", lastKnownCurrentProfileIdForTray);
  const profileSubMenu = lastKnownProfilesForTray.map(profile => ({
    label: profile.name,
    type: 'checkbox',
    checked: profile.id === lastKnownCurrentProfileIdForTray,
    click: () => {
      console.log(`Tray: Profile "${profile.name}" (ID: ${profile.id}) clicked.`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('switch-profile-from-tray', profile.id);
      } else {
        console.warn("Tray: mainWindow not available to send switch-profile event.");
      }
    }
  }));

  const template = [
    {
      label: 'Show Weel',
      click: showMainWindow,
    },
    { type: 'separator' },
    {
      label: 'Profiles',
      submenu: profileSubMenu.length > 0 ? profileSubMenu : [{ label: 'No profiles found', enabled: false }]
    },
    { type: 'separator' },
    {
      label: 'Quit Weel',
      click: function () {
        console.log("Quit Weel selected from tray menu. Setting app.isQuitting = true and calling app.quit().");
        app.isQuitting = true;
        app.quit();
      },
    },
  ];
  return Menu.buildFromTemplate(template);
}


function createWindow() {
  console.log("Creating main window...");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Launch hidden
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  console.log("Main window BrowserWindow object created.");

  if (isDev) {
    console.log("Development mode: Loading http://localhost:3000");
    mainWindow.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(__dirname, "out", "index.html");
    console.log(`Production mode: Loading file ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }


  mainWindow.on('close', function (event) {
    console.log(`Main window 'close' event triggered. app.isQuitting: ${app.isQuitting}`);
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      console.log("Window hidden successfully.");
      if (process.platform === 'darwin') {
        app.dock.hide();
        console.log("Dock icon hidden on macOS.");
      }
    } else {
      console.log("app.isQuitting is true, allowing window to close (app will quit).");
    }
  });

  mainWindow.on('closed', function () {
    console.log("Main window 'closed' (destroyed) event triggered.");
    mainWindow = null; // Important for cleanup
  });

  mainWindow.once('ready-to-show', () => {
    console.log("Main window is ready to show (but respecting 'show: false' initial config).");
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('request-initial-profile-state');
    }
  });
  console.log("Main window created and event listeners attached.");
}


function createTray() {
  console.log("Attempting to create tray icon...");
  const iconName = 'icon.png'; 
  const iconPath = path.join(__dirname, 'assets', iconName);
  console.log(`Tray icon path determined as: ${iconPath}`);

  if (!fs.existsSync(iconPath)) {
    console.error(`!!! Tray icon file NOT FOUND at: ${iconPath}. Tray will not be created. Make sure ${iconName} is in the 'assets' folder in the project root: ${path.join(__dirname, 'assets')}`);
    return;
  }

  let image;
  try {
    image = nativeImage.createFromPath(iconPath);
     if (process.platform === 'darwin') { 
        image = image.resize({ width: 32, height: 32 });
        image.setTemplateImage(true); 
        console.log("Set tray icon as template image and resized for macOS.");
    } else {
        image = image.resize({ width: 32, height: 32 });
    }

    if (image.isEmpty()) {
      console.error(`Failed to load or resize tray icon from ${iconPath}, image is empty. Tray not created.`);
      return;
    }
    console.log(`Successfully created nativeImage for tray from ${iconPath}.`);
  } catch (e) {
    console.error(`Error creating nativeImage for tray from ${iconPath}:`, e);
    return;
  }

  tray = new Tray(image);
  console.log("Tray object created successfully.");

  const contextMenu = buildTrayContextMenu(); // Build initial menu
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Weel');
  console.log("Tray icon configured with tooltip and context menu.");
}

// BLE constants
const UART_SERVICE_UUID = '6e400001b5a3f393e0a9e50e24dcca9e';
const TX_CHAR_UUID = '6e400003b5a3f393e0a9e50e24dcca9e'; // ESP32 → PC (notify)
const RX_CHAR_UUID = '6e400002b5a3f393e0a9e50e24dcca9e'; // PC → ESP32 (write)

let blePeripheral = null;
let rxChar = null;
let txChar = null;

function startBLE() {
  noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
      console.log('🔍 Scanning for devices with UART service...');
      noble.startScanning([UART_SERVICE_UUID], false);
    } else {
      console.log('BLE state is not poweredOn, stopping scan.');
      noble.stopScanning();
    }
  });

  noble.on('discover', async (peripheral) => {
    const name = peripheral.advertisement.localName || '[no name]';
    console.log(`✅ Found device: ${name}, connecting...`);
    noble.stopScanning();
    
    peripheral.on('disconnect', () => {
      console.log(`🔌 BLE disconnected from ${name}, will rescan.`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('esp32-status', { connected: false, error: 'Device disconnected' });
      }
      blePeripheral = null;
      rxChar = null;
      txChar = null;
      setTimeout(() => noble.startScanning([UART_SERVICE_UUID], false), 2000);
    });

    connectToPeripheral(peripheral);
  });
}

function sendToBLE(message) {
  if (rxChar) {
    rxChar.write(Buffer.from(message), false, (err) => {
      if (err) console.error('❌ Failed to send via BLE:', err);
      else console.log('📤 Sent to ESP32 via BLE:', message);
    });
  } else {
    console.warn('⚠️ BLE RX characteristic not ready, cannot send message.');
  }
}

function connectToPeripheral(peripheral) {
  blePeripheral = peripheral;

  peripheral.connect((err) => {
    if (err) {
      console.error('❌ BLE connect error:', err.message || err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('esp32-status', { connected: false, error: `Connection failed: ${err.message}` });
      }
      return;
    }
    console.log(`🔗 Connected to ${peripheral.advertisement.localName || 'device'}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('esp32-status', { connected: true, port: peripheral.advertisement.localName || peripheral.id });
    }

    peripheral.discoverSomeServicesAndCharacteristics(
      [UART_SERVICE_UUID],
      [TX_CHAR_UUID, RX_CHAR_UUID],
      (err, services, characteristics) => {
        if (err) {
          console.error('❌ BLE discover error:', err);
          return;
        }

        txChar = characteristics.find(c => c.uuid === TX_CHAR_UUID);
        rxChar = characteristics.find(c => c.uuid === RX_CHAR_UUID);

        if (txChar) {
          txChar.subscribe((err) => {
            if (err) console.error('❌ TX subscribe error:', err);
          });
          
          txChar.on('data', (data) => {
            const msg = data.toString('utf-8').trim();
            if (!msg) return;
            console.log('📥 From ESP32:', msg);

            if (mainWindow && !mainWindow.isDestroyed()) {
              if (msg.startsWith("BTN_")) {
                const btn = parseInt(msg.slice(4));
                if (!isNaN(btn) && btn > 0) {
                  console.log(`Hardware Button Pressed: ${btn} (raw), sending index ${btn - 1}`);
                  mainWindow.webContents.send('hardware-button-pressed', btn - 1);
                } else {
                  console.warn(`Received malformed BTN_ message: ${msg}`);
                }
              }
            }
          });
        }
        if (!rxChar) console.warn('⚠️ RX characteristic not found.');
      }
    );
  });
}

app.whenReady().then(async () => {
  console.log("App is ready.");
  try {
    const importedIsDev = await import('electron-is-dev');
    isDev = importedIsDev.default;
    console.log(`'electron-is-dev' imported successfully. isDev: ${isDev}`);
  } catch (err) {
    console.error("Failed to dynamically import 'electron-is-dev'. Assuming not in dev mode.", err);
    isDev = false;
  }

  profilesFilePath = path.join(app.getPath('userData'), PROFILES_FILE_NAME);
  console.log("User data path for profiles:", profilesFilePath);

  const initialProfiles = await loadProfilesFromFile();
  if (initialProfiles && Array.isArray(initialProfiles)) {
    lastKnownProfilesForTray = initialProfiles;
    if (initialProfiles.length > 0 && !lastKnownCurrentProfileIdForTray) {
      lastKnownCurrentProfileIdForTray = initialProfiles[0].id;
    }
  } else {
    lastKnownProfilesForTray = []; 
  }

  createWindow(); 
  createTray();   

  if (!isDev) {
    try {
      const currentSettings = app.getLoginItemSettings();
      if (!currentSettings.openAtLogin) {
        app.setLoginItemSettings({
          openAtLogin: true,
          args: ['--autostarted'] 
        });
        console.log('Auto-start at login has been enabled.');
      } else {
        console.log('Auto-start at login is already enabled.');
      }
    } catch (error) {
      console.error('Failed to set auto-start settings:', error);
    }
  }

  startBLE(); 

  app.on('activate', function () {
    console.log("App 'activate' event (e.g., Dock icon clicked on macOS).");
    showMainWindow(); 
  });
  console.log("App ready sequence complete.");
});

app.on('before-quit', () => {
  console.log("App 'before-quit' event triggered. Setting app.isQuitting = true.");
  app.isQuitting = true;
  if (tray) {
    console.log("Destroying tray icon.");
    tray.destroy();
  }
});

app.on('window-all-closed', function () {
  console.log("App 'window-all-closed' event. For tray app, this usually does not quit.");
});

ipcMain.handle('load-profiles', async () => {
  const profiles = await loadProfilesFromFile();
  if (profiles && Array.isArray(profiles)) {
    lastKnownProfilesForTray = profiles; 
    if (tray) tray.setContextMenu(buildTrayContextMenu());
  } else {
    lastKnownProfilesForTray = [];
    if (tray) tray.setContextMenu(buildTrayContextMenu());
  }
  return profiles;
});

ipcMain.handle('save-profiles', async (event, profilesData) => {
  const result = await saveProfilesToFile(profilesData);
  if (result.success) {
    console.log("Profiles saved, updating tray menu's knowledge.");
    lastKnownProfilesForTray = profilesData; 
    if (tray) {
      tray.setContextMenu(buildTrayContextMenu());
    }
  }
  return result;
});

ipcMain.on('renderer-profile-state-update', (event, { profiles, currentProfileId }) => {
  console.log('Main: Received renderer-profile-state-update:', { profiles, currentProfileId });
  lastKnownProfilesForTray = profiles && Array.isArray(profiles) ? profiles : [];
  lastKnownCurrentProfileIdForTray = currentProfileId;
  if (tray) {
    tray.setContextMenu(buildTrayContextMenu());
    console.log('Main: Tray menu updated via renderer-profile-state-update.');
  } else {
    console.warn('Main: renderer-profile-state-update received but tray is not initialized.');
  }
});

ipcMain.handle('get-installed-apps', async () => {
  const platform = os.platform();
  const appDirs = new Set();

  if (platform === 'darwin') {
    // macOS - scan more locations
    appDirs.add('/Applications');
    appDirs.add(path.join(os.homedir(), 'Applications'));
    appDirs.add('/System/Applications');
    appDirs.add('/System/Applications/Utilities');
  } else if (platform === 'win32') {
    // Windows - scan program files and start menu
    if (process.env.ProgramFiles) appDirs.add(process.env.ProgramFiles);
    if (process.env['ProgramFiles(x86)']) appDirs.add(process.env['ProgramFiles(x86)']);
    if (process.env.APPDATA) {
      appDirs.add(path.join(process.env.APPDATA, 'Microsoft/Windows/Start Menu/Programs'));
    }
    if (process.env.LOCALAPPDATA) {
      appDirs.add(path.join(process.env.LOCALAPPDATA, 'Programs'));
    }
  } else if (platform === 'linux') {
    // Linux - scan standard .desktop locations
    appDirs.add('/usr/share/applications');
    appDirs.add('/usr/local/share/applications');
    appDirs.add(path.join(os.homedir(), '.local/share/applications'));
  }

  const apps = [];
  for (const dir of appDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (platform === 'darwin' && file.name.endsWith('.app') && file.isDirectory()) {
          // macOS - get app name and path
          const appPath = path.join(dir, file.name);
          const appName = file.name.replace('.app', '');
          
          // Try to get icon from app bundle
          let iconPath = null;
          try {
            const contentsPath = path.join(appPath, 'Contents', 'Resources');
            if (fs.existsSync(contentsPath)) {
              const resources = fs.readdirSync(contentsPath);
              const icnsFile = resources.find(f => f.endsWith('.icns'));
              if (icnsFile) {
                iconPath = path.join(contentsPath, icnsFile);
              }
            }
          } catch (e) {
            console.error(`Error reading app bundle ${file.name}:`, e);
          }
          
          apps.push({ 
            name: appName, 
            path: appPath,
            icon: iconPath 
          });
        } else if (platform === 'win32') {
          // Windows - handle .lnk files and exe files
          if (file.name.endsWith('.lnk') || file.name.endsWith('.exe')) {
            apps.push({
              name: file.name.replace(/\.(lnk|exe)$/i, ''),
              path: path.join(dir, file.name),
              icon: null // TODO: Implement icon extraction for Windows
            });
          } else if (file.isDirectory()) {
            // Check for executables in directory
            try {
              const exeFiles = fs.readdirSync(path.join(dir, file.name))
                .filter(f => f.endsWith('.exe'));
              
              if (exeFiles.length > 0) {
                apps.push({
                  name: file.name,
                  path: path.join(dir, file.name, exeFiles[0]),
                  icon: null
                });
              }
            } catch (e) {
              console.error(`Error scanning Windows app directory ${file.name}:`, e);
            }
          }
        } else if (platform === 'linux' && file.name.endsWith('.desktop')) {
          // Linux - parse .desktop files
          try {
            const desktopFile = path.join(dir, file.name);
            const content = fs.readFileSync(desktopFile, 'utf-8');
            const nameMatch = content.match(/^Name=(.*)$/m);
            const execMatch = content.match(/^Exec=(.*)$/m);
            const iconMatch = content.match(/^Icon=(.*)$/m);
            
            if (nameMatch && execMatch) {
              apps.push({
                name: nameMatch[1] || file.name.replace('.desktop', ''),
                path: execMatch[1].replace(/ %./g, ''), // Remove common desktop file placeholders
                icon: iconMatch ? iconMatch[1] : null
              });
            }
          } catch (e) {
            console.error(`Error parsing .desktop file ${file.name}:`, e);
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err);
    }
  }

  // Deduplicate and sort
  const uniqueApps = Array.from(new Map(apps.map(app => [app.name, app])).values());
  uniqueApps.sort((a, b) => a.name.localeCompare(b.name));
  
  return Array.from(uniqueApps);
});

ipcMain.handle('perform-action', async (event, actionDetails) => {
  console.log('Action received in Electron main process:', actionDetails);
  const { type, value, name } = actionDetails;

  try {
    switch (type) {
      case 'open_url':
      case 'system_website':
        await shell.openExternal(value);
        return { success: true, message: `Successfully opened URL: ${value}` };

      case 'system_open_app': {
        let openAppCommand;
        const appNameForCommand = value.endsWith('.app') ? value : `${value}.app`;

        if (process.platform === 'darwin') {
          // On macOS, `open` can handle both paths and names
          openAppCommand = `open "${value}"`;
        } else if (process.platform === 'win32') {
          // On Windows, `start` is safer for paths that might contain spaces
          openAppCommand = `start "" "${value}"`;
        } else {
          // For Linux, the value might be the command itself
          openAppCommand = value;
        }
        return new Promise((resolve, reject) => {
          exec(openAppCommand, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error opening app ${value}:`, error.message);
              // macOS specific retry logic
              if (process.platform === 'darwin' && !value.endsWith('.app')) {
                 console.log(`Retrying to open ${appNameForCommand} on macOS...`);
                 exec(`open -a "${appNameForCommand}"`, (err2) => {
                    if (err2) {
                        console.error(`Retry error opening app ${appNameForCommand}:`, err2.message);
                        reject({ success: false, message: `Failed to open app: ${value}. Error: ${error.message}. Retry with .app also failed: ${err2.message}` });
                    } else {
                         resolve({ success: true, message: `Successfully initiated opening of app: ${appNameForCommand}` });
                    }
                 });
              } else {
                reject({ success: false, message: `Failed to open app: ${value}. Error: ${error.message}` });
              }
              return;
            }
            if (stderr) console.warn(`Stderr opening app ${value}:`, stderr);
            resolve({ success: true, message: `Successfully initiated opening of app: ${value}` });
          });
        });
      }

      case 'system_open':
        try {
            await shell.openPath(value);
            return { success: true, message: `Successfully attempted to open path: ${value}` };
        } catch (err) {
            console.error(`Error opening path ${value} with shell.openPath:`, err);
            return { success: false, message: `Failed to open path: ${value}. Error: ${err.message || err}` };
        }

      case 'run_script':
        return new Promise((resolve, reject) => {
          exec(value, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error running script ${value}:`, error);
              reject({ success: false, message: `Failed to run script: ${value}. Error: ${error.message}` });
              return;
            }
            if (stderr) console.warn(`Stderr running script ${value}:`, stderr);
            resolve({ success: true, message: `Script "${name || value}" executed. Output: ${stdout || '(no stdout)'}` });
          });
        });
      
      case 'system_multimedia': {
        const robot = require('robotjs');
        switch (value) {
          case 'play_pause':
            robot.keyTap('audio_play');
            return { success: true, message: `Action 'Play/Pause' executed.` };
          case 'next':
            robot.keyTap('audio_next');
            return { success: true, message: `Action 'Next Track' executed.` };
          case 'prev':
            robot.keyTap('audio_prev');
            return { success: true, message: `Action 'Previous Track' executed.` };
          case 'stop':
            robot.keyTap('audio_stop');
            return { success: true, message: `Action 'Stop' executed.` };
          default:
            return { success: false, message: `Unknown multimedia action value: ${value}` };
        }
      }

      case 'volume_control': {
        const robot = require('robotjs');
        switch (value) {
            case 'increase':
              robot.keyTap('audio_vol_up');
              return { success: true, message: 'Volume increased.' };
            case 'decrease':
              robot.keyTap('audio_vol_down');
              return { success: true, message: 'Volume decreased.' };
            case 'mute_toggle':
              robot.keyTap('audio_mute');
              return { success: true, message: 'Mute toggled.' };
            default:
              return { success: false, message: `Unknown volume_control action value: ${value}` };
        }
      }

      case 'sleep': {
        let sleepCommand;
        if (process.platform === 'darwin') {
          sleepCommand = 'pmset sleepnow';
        } else if (process.platform === 'win32') {
          sleepCommand = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0';
        } else {
          sleepCommand = 'systemctl suspend';
        }
        return new Promise((resolve) => {
          exec(sleepCommand, (error) => {
            if (error) {
              console.error(`Error putting system to sleep:`, error);
              resolve({ success: false, message: `Failed to put system to sleep: ${error.message}` });
            } else {
              resolve({ success: true, message: 'System is going to sleep.' });
            }
          });
        });
      }
      
      case 'system_text': {
        const robot = require('robotjs');
        robot.typeString(value);
        return { success: true, message: `Typed text.` };
      }

      case 'hotkey':
      case 'system_hotkey': {
        const robot = require('robotjs');
        try {
          const hotkey = value?.trim();
          if (!hotkey) return { success: false, message: 'No hotkey specified' };
          const parts = hotkey.split('+').map(k => k.trim().toLowerCase());
          const key = parts.pop();
          const modifiers = parts; 
          robot.keyTap(key, modifiers);
          return { success: true, message: `Pressed ${hotkey}` };
        } catch (err) {
          return { success: false, message: `Failed to press hotkey: ${err.message}` };
        }
      }

      case 'none':
        return { success: true, message: 'Action type is "none", no operation performed.' };

      default:
        console.warn(`Unknown or unhandled action type: ${type}`);
        return { success: false, message: `Unknown or unhandled action type: ${type}` };
    }
  } catch (error) {
    console.error('Error performing action in main process:', error);
    return { success: false, message: `Error performing action: ${error.message || error}` };
  }
});

