class BleDevice {
    constructor(device, gatt) {
        console.debug('Creating BLE device');
        this.device = device;
        this.gatt = gatt;
    }
}

class BleDevicesManager {
    constructor() {
        console.debug('Creating BleDeviceManager');
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
                console.info('Registering new device with address ' + deviceAddress);
                this._devices[deviceAddress] = new BleDevice(device, await device.gatt());
            } else {
                console.info('Device with address ' + deviceAddress + ' already registered in Device Manager');
            }
        } else {
            console.info('Trying to register empty device');
        }
    }

    async getDevice(address) {
        address = address.toUpperCase();

        console.debug('Requesting device with address ' + address);
        if (this.isDeviceRegistered(address)) {
            console.debug('Device ' + address + ' is registered in Device Manager');
            var bleDevice = this._devices[address];
            return {
                device: bleDevice.device,
                gatt: bleDevice.gatt,
                connected: await bleDevice.device.isConnected()
            };
        }
        console.warn('Trying to get device ' + address + ' which is not registered');
        throw new Error('Trying to get device ' + address + ' which is not registered');
    }

    async removeDevice(address) {
        address = address.toUpperCase();

        console.debug('Requesting disconnection to device with address ' + address);
        if (this.isDeviceRegistered(address)) {
            console.debug('Device ' + address + ' is registered in Device Manager');
            var bleDevice = this._devices[address];
            if (await bleDevice.device.isConnected()) {
                console.debug('Device ' + address + ' is connected');
                await bleDevice.device.disconnect();
            }
            console.debug('Unregistering device ' + address + ' from Device Manager');
            delete this._devices[address];
            return;
        }
        console.warn('Trying to disconnect device ' + address + ' which is not registered');
    }

    async getService(deviceAddress, serviceUuid) {
        var service = null;

        console.debug('Requesting service ' + serviceUuid + ' from device ' + deviceAddress);
        try {
            var { _, gatt, _ } = await this.getDevice(deviceAddress);
            var serviceTmp = await gatt.getPrimaryService(serviceUuid.toLowerCase());
            service = serviceTmp;
        } catch (error) {
            console.warn('Getting service ' + serviceUuid +
                ' from device ' + deviceAddress +
                ' returns error: ' + error);
        }
        return service;
    }

    async getCharacteristic(deviceAddress, serviceUuid, characteristicUuid) {
        var characteristic = null;

        console.debug('Requesting service ' + serviceUuid + ' from device ' + deviceAddress);
        try {
            var { _, gatt, _ } = await this.getDevice(deviceAddress);
            var service = await gatt.getPrimaryService(serviceUuid.toLowerCase());
            var characteristicTmp = await service.getCharacteristic(characteristicUuid.toLowerCase());
            characteristic = characteristicTmp
        } catch (error) {
            console.warn('Getting characteristic ' + characteristicUuid +
                ' from service ' + serviceUuid +
                ' from device ' + deviceAddress +
                ' returns error: ' + error);
        }
        return characteristic;
    }

    async startNotifications(characteristic) {
        var success = false;

        console.debug('Requesting to start notifications for characteristic ' + await characteristic.toString());
        if (characteristic) {
            //todo: check if it has notify flag
            if (!(await characteristic.isNotifying())) {
                console.info('Starting notifications for characteristic ' + await characteristic.toString());
                await characteristic.startNotifications();
            }
            success = true;
        }
        return success;
    }

    async stopNotifications(characteristic) {
        var characteristicAddress = await characteristic.toString();

        console.debug('Requesting to stop notifications for characteristic ' + characteristicAddress);
        if (characteristic) {
            if (await characteristic.isNotifying()) {
                console.info('Stopping notifications for characteristic ' + characteristicAddress);
                await characteristic.stopNotifications();
            } else {
                console.debug('Notifications for characteristic ' + characteristicAddress + ' were not started');
            }
        }
    }
}

var instance = null;
module.exports.getBleDevicesManager = function () {
    console.debug('Requesting BleDeviceManager instance');
    if (!instance) {
        instance = new BleDevicesManager();
    }
    return instance;
};