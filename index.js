const noble = require('noble');

const identify = require('./identify');

let Characteristic;
let Service;

const RSSI_THRESHOLD = -90;

class AutomationBluetoothPresence {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    this.deviceId = config.deviceId;
    const configGracePeriod = config.gracePeriod || 10 * 60; // 10 minutes;
    this.gracePeriod = configGracePeriod * 1000;

    this.device = false;
    this.deviceFound = false;

    this.services = this.createServices();

    this.discoverDevices();
  }

  discoverDevices() {
    noble.on('stateChange', (state) => {
      if (state === 'poweredOn') {
        this.log('Looking for Bluetooth devices');
        noble.startScanning([], true);
      } else {
        noble.stopScanning();
      }
    });

    noble.on('discover', this.deviceDiscovered.bind(this));
    setInterval(this.deviceTimer.bind(this), 1000);
  }

  deviceDiscovered(peripheral) {
    if (peripheral.rssi < RSSI_THRESHOLD) {
      // ignore, device is out of range
      return;
    }

    const { id } = peripheral;
    if (id !== this.deviceId) {
      // ignore, not the right device
      return;
    }

    const entered = !this.device;
    if (entered) {
      this.device = {
        peripheral,
      };

      this.log(`Device "${peripheral.advertisement.localName}" entered`);
    }

    this.setPresence(true);
    this.device.lastSeen = Date.now();
  }

  deviceTimer() {
    if (!this.device) {
      return;
    }

    if (this.device.lastSeen < (Date.now() - this.gracePeriod)) {
      this.log('Device exited');
      this.device = false;
      this.setPresence(false);
    }
  }

  setPresence(present) {
    this.deviceFound = present;
    this.occupancySensor
      .getCharacteristic(Characteristic.OccupancyDetected)
      .updateValue(present);
  }

  createServices() {
    this.occupancySensor = new Service.OccupancySensor(this.name);
    this.occupancySensor
      .getCharacteristic(Characteristic.OccupancyDetected)
      .on('get', callback => callback(null, this.deviceFound));

    return [
      this.occupancySensor,
    ];
  }

  getServices() {
    return this.services;
  }

  identify(callback) {
    if (this.device) {
      this.log('Issuing identify request');
      identify(this.device);
    } else {
      this.log('Device not found');
    }

    callback();
  }
}

module.exports = (homebridge) => {
  Service = homebridge.hap.Service; // eslint-disable-line
  Characteristic = homebridge.hap.Characteristic; // eslint-disable-line

  homebridge.registerAccessory('homebridge-automation-bluetooth-presence', 'AutomationBluetoothPresence', AutomationBluetoothPresence);
};
