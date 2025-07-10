const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  performAction: (actionDetails) => ipcRenderer.invoke('perform-action', actionDetails),

  onHardwareButton: (callback) => {
    const channel = 'hardware-button-pressed';
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  onESP32Status: (callback) => {
    const channel = 'esp32-status';
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  loadProfiles: () => ipcRenderer.invoke('load-profiles'),
  saveProfiles: (profilesData) => ipcRenderer.invoke('save-profiles', profilesData),
  
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),

  // For tray menu interactions
  sendRendererProfileStateUpdate: (data) => {
    console.log('Preload: Sending renderer-profile-state-update to main:', data);
    ipcRenderer.send('renderer-profile-state-update', data);
  },
  onSwitchProfileFromTray: (callback) => {
    const channel = 'switch-profile-from-tray';
    console.log('Preload: Setting up listener for onSwitchProfileFromTray');
    const subscription = (event, profileId) => callback(profileId);
    ipcRenderer.on(channel, subscription);
    return () => {
      console.log('Preload: Removing listener for onSwitchProfileFromTray');
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  onRequestInitialProfileState: (callback) => {
    const channel = 'request-initial-profile-state';
    console.log('Preload: Setting up listener for onRequestInitialProfileState');
    const subscription = (event) => callback();
    ipcRenderer.on(channel, subscription);
    return () => {
      console.log('Preload: Removing listener for onRequestInitialProfileState');
      ipcRenderer.removeListener(channel, subscription);
    }
  }
});