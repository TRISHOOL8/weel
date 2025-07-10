const noble = require('@abandonware/noble');

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    console.log('🟢 Bluetooth is ON. Starting scan...');
    noble.startScanning([], false);
  } else {
    console.log('🔴 Bluetooth is NOT powered on:', state);
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  const name = peripheral.advertisement.localName || 'Unnamed';
  console.log(`🔍 Found BLE device: ${name} [${peripheral.uuid}]`);
});
