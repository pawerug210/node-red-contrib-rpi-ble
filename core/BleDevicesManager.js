const logger = require('EasyLogger').logger;

class BleDevice {
    constructor(device, gatt) {
        logger.debug('Creating BLE device');
        this._device = device;
        this._gatt = gatt;
        this._servicesCharacteristicsMap = {};
    }

    getDevice() {
        return this._device;
    }

    getGatt() {
        return this._gatt;
    }

    async addCharacteristic(characteristic, serviceUuid) {
        var key = this._createKey(await characteristic.getUUID(), serviceUuid);
        if (key in this._servicesCharacteristicsMap) {
            return;
        }
        this._servicesCharacteristicsMap[key] = characteristic;
    }

    getCharacteristic(characteristicUuid, serviceUuid) {
        var key = this._createKey(characteristicUuid, serviceUuid);
        if (key in this._servicesCharacteristicsMap) {
            return this._servicesCharacteristicsMap[key];
        }
        return null;
    }

    async connect() {
        await this._device.connect();
    }

    async disconnect() {
        await this._device.disconnect();
    }

    async isConnected() {
        await this._device.isConnected();
    }

    _createKey(characteristicUuid, serviceUuid) {
        return serviceUuid.toString().toLowerCase() + '_' + characteristicUuid.toString().toLowerCase();
    }
}

class BleDevicesManager {
    constructor() {
        logger.debug('Creating BleDeviceManager');
        this._devices = {}
    }

    isDeviceRegistered(address) {
        address = address.toUpperCase();
        return address in this._devices;
    }

    async registerDevice(device) {
        if (device) {
            var deviceAddress = (await device.getAddress()).toUpperCase();
            if (!this.isDeviceRegistered(deviceAddress)) {
                logger.info('Registering new device with address ' + deviceAddress);
                this._devices[deviceAddress] = new BleDevice(device, await device.gatt());
            } else {
                logger.info('Device with address ' + deviceAddress + ' already registered in Device Manager');
            }
        } else {
            logger.info('Trying to register empty device');
        }
    }

    async getDevice(address) {
        address = address.toUpperCase();

        logger.debug('Requesting device with address ' + address);
        if (this.isDeviceRegistered(address)) {
            logger.debug('Device ' + address + ' is registered in Device Manager');
            return this._devices[address];
        }
        logger.warn('Trying to get device ' + address + ' which is not registered');
        throw new Error('Trying to get device ' + address + ' which is not registered');
    }

    async removeDevice(address) {
        address = address.toUpperCase();

        logger.debug('Requesting disconnection to device with address ' + address);
        if (this.isDeviceRegistered(address)) {
            logger.debug('Device ' + address + ' is registered in Device Manager');
            var bleDevice = this._devices[address];
            if (await bleDevice.isConnected()) {
                logger.debug('Device ' + address + ' is connected');
                await bleDevice.disconnect();
            }
            logger.debug('Unregistering device ' + address + ' from Device Manager');
            delete this._devices[address];
            return;
        }
        logger.warn('Trying to disconnect device ' + address + ' which is not registered');
    }

    async isServiceAvailable(deviceAddress, serviceUuid) {
        var serviceAvailable = false;

        logger.debug('Requesting service ' + serviceUuid + ' from device ' + deviceAddress);
        try {
            var bleDevice = await this.getDevice(deviceAddress);
            var services = await bleDevice.getGatt().services();
            logger.debug('Available services in device ' + deviceAddress + ': ' + services);
            serviceAvailable = services.includes(serviceUuid.toLowerCase());
        } catch (error) {
            logger.warn('Getting service ' + serviceUuid +
                ' from device ' + deviceAddress +
                ' returned error: ' + error);
        }
        return serviceAvailable;
    }

    async getCharacteristic(deviceAddress, serviceUuid, characteristicUuid) {
        var characteristic = null;

        logger.debug('Requesting characteristic ' + characteristicUuid +
            ' service ' + serviceUuid +
            ' from device ' + deviceAddress);
        try {
            var bleDevice = await this.getDevice(deviceAddress);
            characteristic = bleDevice.getCharacteristic(characteristicUuid, serviceUuid);
            if (characteristic) {
                return characteristic;
            }
            var service = await bleDevice.getGatt().getPrimaryService(serviceUuid.toLowerCase());
            characteristic = await service.getCharacteristic(characteristicUuid.toLowerCase());
            if (characteristic) {
                await bleDevice.addCharacteristic(characteristic, serviceUuid);
                return characteristic;
            }
        } catch (error) {
            logger.warn('Getting characteristic ' + characteristicUuid +
                ' from service ' + serviceUuid +
                ' from device ' + deviceAddress +
                ' returned error: ' + error);
        }
        return characteristic;
    }

    async startNotifications(characteristic) {
        var success = false;

        logger.debug('Requesting to start notifications for characteristic ' + await characteristic.toString());
        if (characteristic) {
            //todo: check if it has notify flag
            if (!(await characteristic.isNotifying())) {
                logger.info('Starting notifications for characteristic ' + await characteristic.toString());
                await characteristic.startNotifications();
            }
            success = true;
        }
        return success;
    }

    async stopNotifications(characteristic) {
        var characteristicAddress = await characteristic.toString();

        logger.debug('Requesting to stop notifications for characteristic ' + characteristicAddress);
        if (characteristic) {
            if (await characteristic.isNotifying()) {
                logger.info('Stopping notifications for characteristic ' + characteristicAddress);
                await characteristic.stopNotifications();
            } else {
                logger.debug('Notifications for characteristic ' + characteristicAddress + ' were not started');
            }
        }
    }
}

var instance = null;
module.exports.getBleDevicesManager = function () {
    logger.debug('Requesting BleDeviceManager instance');
    if (!instance) {
        instance = new BleDevicesManager();
    }
    return instance;
};