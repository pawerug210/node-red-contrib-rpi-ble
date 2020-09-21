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

    async registerDevice(device) {
        if (device != null) {
            var device_address = (await device.getAddress()).toUpperCase();
            if (!(device_address in this._devices)) {
                console.info('Registering new device with address ' + device_address);
                this._devices[device_address] = new BleDevice(device, await device.gatt());
            } else {
                console.info('Device with address ' + device_address + ' already registered in Device Manager');
            }
        } else {
            console.info('Trying to register empty device');
        }
    }

    async getDevice(address) {
        address = address.toUpperCase();

        console.debug('Requesting device with address ' + address);
        if (address in this._devices) {
            console.debug('Device ' + address + ' is registered in Device Manager');
            var bleDevice = this._devices[address];
            return {
                device: bleDevice.device,
                gatt: bleDevice.gatt,
                connected: await bleDevice.device.isConnected()
            };
        }
        console.warn('Trying to get device ' + address + ' which is not registered');
        return null;
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
        if (characteristic != null) {
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
        if (characteristic != null) {
            console.info('Stopping notifications for characteristic ' + await characteristic.toString());
            await characteristic.stopNotifications();
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