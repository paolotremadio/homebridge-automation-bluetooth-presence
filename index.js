const noble = require('noble');
const debug = require('debug');
const fakegatoHistory = require('fakegato-history');

const identify = require('./identify');
const pkginfo = require('./package');

let Characteristic;
let Service;
let storagePath;

let FakeGatoHistoryService;
const RSSI_THRESHOLD = -90;

class AutomationBluetoothPresence {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.debug = debug(`homebridge-automation-bluetooth-presence-${this.name}`);

    this.deviceId = config.deviceId;
    const configGracePeriod = config.gracePeriod || 10 * 60; // 10 minutes;
    this.gracePeriod = configGracePeriod * 1000;

    this.device = false;
    this.deviceFound = false;
    this.rescanTimeout = null;

    this.services = this.createServices();

    this.discoverDevices();
  }

  discoverDevices() {
    noble.on('stateChange', (state) => {
      if (state === 'poweredOn') {
        this.log('Looking for Bluetooth devices');
        noble.startScanning([], false);
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
    this.debug(`Device seen - Entered: ${entered} - Last seen: ${new Date()}`);

    this.startRescanTimer();
  }

  startRescanTimer() {
    if (this.rescanTimeout) {
      clearTimeout(this.rescanTimeout);
    }

    this.rescanTimeout = setTimeout(() => {
      this.debug('Restart scanning');
      noble.stopScanning();
      noble.startScanning([], false);
    }, 60 * 1000);
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
    if (this.deviceFound !== present) {
      this.loggingService.addEntry({ time: new Date().getTime(), status: present ? 1 : 0 });
    }

    this.deviceFound = present;

    this.motionSensor
      .getCharacteristic(Characteristic.MotionDetected)
      .updateValue(present);
  }

  createServices() {
    this.motionSensor = new Service.MotionSensor(this.name);
    this.motionSensor
      .getCharacteristic(Characteristic.MotionDetected)
      .on('get', callback => callback(null, this.deviceFound));
    this.motionSensor.log = this.log;

    const accessoryInformationService = new Service.AccessoryInformation();
    accessoryInformationService
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, pkginfo.author.name || pkginfo.author)
      .setCharacteristic(Characteristic.Model, pkginfo.name)
      .setCharacteristic(Characteristic.SerialNumber, this.deviceId)
      .setCharacteristic(Characteristic.FirmwareRevision, pkginfo.version)
      .setCharacteristic(Characteristic.HardwareRevision, pkginfo.version);

    this.loggingService = new FakeGatoHistoryService(
      'motion',
      this.motionSensor,
      {
        storage: 'fs',
        path: `${storagePath}/accessories`,
        filename: `history_bp_${this.deviceId}.json`,
      },
    );

    return [
      this.motionSensor,
      accessoryInformationService,
      this.loggingService,
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
  storagePath = homebridge.user.storagePath(); // eslint-disable-line

  FakeGatoHistoryService = fakegatoHistory(homebridge);
  homebridge.registerAccessory('homebridge-automation-bluetooth-presence', 'AutomationBluetoothPresence', AutomationBluetoothPresence);
};
