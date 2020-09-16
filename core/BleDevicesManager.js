class BleDevice {
    constructor(device, gatt) {
        this.device = device;
        this.gatt = gatt;
    }
}

class BleDevicesManager {
    constructor() {
        console.log("Creating BleDeviceManager");
        this._devices = {}
    }

    async registerDevice(device) {
        if (device != null) {
            var device_address = await device.getAddress();
            console.log('registering device with address ' + device_address.toUpperCase());
            this._devices[device_address.toUpperCase()] = new BleDevice(device, await device.gatt());
        }
    }

    async getDevice(address) {
        console.log('Getting device with address ' + address);
        if (address in this._devices) {
            console.log('Device ' + address + ' registered');
            var bleDevice = this._devices[address];
            if (await bleDevice.device.isConnected()) {
                console.log('Device ' + address + ' is connected')
                return bleDevice;
            } else {
                console.log("Trying to reconnect device " + address);
                await bleDevice.device.connect();
                bleDevice.gatt = await bleDevice.device.gatt();
                return bleDevice;
            }
        }
        console.log("Device " + address + " not registered");
        return null;
    }

    async getService(deviceAddress, serviceUuid) {
        var service = null;
        try {
            var device = await this.getDevice(deviceAddress);
            var serviceTmp = await device.gatt.getPrimaryService(serviceUuid.toLowerCase());
            service = serviceTmp;
        } catch(error) {
            console.log('Getting service error: ' + error);
        }
        return service;
    }

    async getCharacteristic(deviceAddress, serviceUuid, characteristicUuid) {
        var characteristic = null;
        try {
            var device = await this.getDevice(deviceAddress);
            var service = await device.gatt.getPrimaryService(serviceUuid.toLowerCase());
            var characteristicTmp = await service.getCharacteristic(characteristicUuid.toLowerCase());
            characteristic = characteristicTmp
        } catch(error) {
            console.log('Getting characteristic error: ' + error);
        }
        return characteristic;
    }

    async subscribeCharacteristic(deviceAddress, serviceUuid, characteristicUuid, notifyFunc) {
        var success = false;
        var characteristic = await this.getCharacteristic(deviceAddress, serviceUuid, characteristicUuid);
        if (characteristic != null) {
            //todo: check if it has notify flag
            
            if (!(await characteristic.isNotifying())) {
                await characteristic.startNotifications();
                console.log("Setting notify function");
                characteristic.on('valuechanged', notifyFunc);
            }
            success = true;
        }
        return success; 
    }

    async stopSubscribing(deviceAddress, serviceUuid, characteristicUuid) {
        var characteristic = await this.getCharacteristic(deviceAddress, serviceUuid, characteristicUuid);
        if (characteristic != null) {
            await characteristic.stopNotifications();
        }
    }
}

var instance = null;
module.exports.getBleDevicesManager = function() {
    console.debug("Requesting BleDeviceManager");
    if (!instance) {
        instance = new BleDevicesManager();
    }
    return instance;
};