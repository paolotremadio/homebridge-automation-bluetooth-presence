const noble = require('noble');

const formatRSSI = (rssi) => {
  const signal = 2 * (rssi + 100);
  if (signal > 100) {
    return 100;
  }
  return signal;
};

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    console.log('Scanning for devices... [Hit Ctrl+C to stop]');
    noble.startScanning([], false);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  const id = process.platform === 'darwin' ? peripheral.id : peripheral.address;
  console.log(`[${new Date()}] ID: ${id}\tSignal: ${formatRSSI(peripheral.rssi)}%\tName: ${peripheral.advertisement.localName}`);
});
