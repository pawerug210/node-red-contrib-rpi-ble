class BleDevice {
    constructor(device, gatt) {
        console.debug('Creating BLE device');
        this.device = device;
        this.gatt = gatt;
    }
}

class BleDevicesManager {
    constructor() {
        console.debug("Creating BleDeviceManager");
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
            if (await bleDevice.device.isConnected()) {
                console.info('Device ' + address + ' registered and connected');
                return bleDevice;
            } else {
                console.info("Trying to reconnect device " + address);
                await bleDevice.device.connect();
                bleDevice.gatt = await bleDevice.device.gatt();
                return bleDevice;
            }
        }
        console.warn("Trying to get device " + address + " which is not registered");
        return null;
    }

    async getService(deviceAddress, serviceUuid) {
        var service = null;

        console.debug('Requesting service ' + serviceUuid + ' from device ' + address);
        try {
            var device = await this.getDevice(deviceAddress);
            var serviceTmp = await device.gatt.getPrimaryService(serviceUuid.toLowerCase());
            service = serviceTmp;
        } catch(error) {
            console.warn('Getting service ' + serviceUuid + 
                        ' from device ' + deviceAddress + 
                        ' returns error: ' + error);
        }
        return service;
    }

    async getCharacteristic(deviceAddress, serviceUuid, characteristicUuid) {
        var characteristic = null;

        console.debug('Requesting service ' + serviceUuid + ' from device ' + address);
        try {
            var device = await this.getDevice(deviceAddress);
            var service = await device.gatt.getPrimaryService(serviceUuid.toLowerCase());
            var characteristicTmp = await service.getCharacteristic(characteristicUuid.toLowerCase());
            characteristic = characteristicTmp
        } catch(error) {
            console.warn('Getting characteristic ' + characteristicUuid + 
                        ' from service ' + serviceUuid + 
                        ' from device ' + deviceAddress + 
                        ' returns error: ' + error);
        }
        return characteristic;
    }

    async subscribeCharacteristic(deviceAddress, serviceUuid, characteristicUuid, notifyFunc) {
        var success = false;
        var characteristic = await this.getCharacteristic(deviceAddress, serviceUuid, characteristicUuid);
        console.debug('Requested notifications for characteristic ' + characteristicUuid +
                    ' from service ' + serviceUuid + 
                    ' from device ' + deviceAddress);
        if (characteristic != null) {
            //todo: check if it has notify flag
            if (!(await characteristic.isNotifying())) {
                console.info('Starting notifications for characteristic ' + characteristicUuid +
                            ' from service ' + serviceUuid + 
                            ' from device ' + deviceAddress);
                await characteristic.startNotifications();
                characteristic.on('valuechanged', notifyFunc);
            }
            success = true;
        } else {
            console.warn('Characteristic ' + characteristicUuid + ' to subscribe not found');
        }
        return success; 
    }

    async stopSubscribing(deviceAddress, serviceUuid, characteristicUuid) {
        var characteristic = await this.getCharacteristic(deviceAddress, serviceUuid, characteristicUuid);
        console.debug('Requested stop notifications for characteristic ' + characteristicUuid +
                    ' from service ' + serviceUuid + 
                    ' from device ' + deviceAddress);
        if (characteristic != null) {
<<<<<<< Updated upstream
=======
            console.info('Stopping notifications for characteristic ' + characteristicUuid +
                        ' from service ' + serviceUuid + 
                        ' from device ' + deviceAddress);
>>>>>>> Stashed changes
            await characteristic.stopNotifications();
        }
    }
}

var instance = null;
module.exports.getBleDevicesManager = function() {
    console.debug("Requesting BleDeviceManager instance");
    if (!instance) {
        instance = new BleDevicesManager();
    }
    return instance;
};