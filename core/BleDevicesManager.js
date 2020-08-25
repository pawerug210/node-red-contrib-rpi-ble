class BleDevice {
    constructor(device, gatt) {
        this.device = device;
        this.gatt = gatt;
    }
}

class BleDevicesManager {
    constructor() {
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
}

var instance = null;
module.exports.getBleDevicesManager = function() {
    if (!instance) {
        console.log("Creating ble devices manager");
        instance = new BleDevicesManager();
    }
    return instance;
};