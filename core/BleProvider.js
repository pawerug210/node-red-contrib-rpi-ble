class BleProvider {
    constructor() {
        const node_ble = require('node-ble');
        console.debug('Creating BleProvider');
        var createBluetooth = node_ble.createBluetooth();
        this.bluetooth = createBluetooth.bluetooth;
        this.destroy = createBluetooth.destroy;
        this.adapter = null;
    }

    async initializeAdapter(adapter = null) {
        if (this.adapter == null) {
            try {
                if (adapter == null) {
                    console.info('Creating default adapter');
                    this.adapter = await this.bluetooth.defaultAdapter();
                } else {
                    console.info('Creating specific adapter: ' + adapter);
                    this.adapter = await this.bluetooth.getAdapter(adapter);
                }
            }
            catch (error) {
                console.warn('Creating adapter error; ' + error);
            }
        } else {
            console.debug('adapter already initialized');
        }
        return this.adapter;
    }

    async startDiscovery() {
        //todo: timeout
        if (! (await this.adapter.isDiscovering())) {
            console.info('Starting adapter discovery');
            await this.adapter.startDiscovery();
        } else {
            console.debug('Trying to start adapter discovery but it was already discovering');
        }
    }

    async stopDiscovery() {
        if (await this.adapter.isDiscovering()) {
            console.info('Stopping adapter discovery');
            await this.adapter.stopDiscovery();
        } else {
            console.debug('Trying to stop adapter discovery but it was not in discovering');
        }
    }

    async waitDevice(address, timeout, connectedFunc, disconnectedFunc) {
        address = address.toUpperCase();
        var device = null;

        console.info('Requesting connection with device ' + address);
        try {
            device = await this.adapter.waitDevice(address, timeout);
            console.info('Device ' + address +' found, trying to connect...');
            device.on('connect', connectedFunc);
            device.on('disconnect', disconnectedFunc);
            await device.connect();
        } catch (error) {
            console.warn('Connection to device ' + address + ' error; ' + error);
            device = null;
        }
        return device;
    }

    destroy() {
        console.debug('Requesting BT stream destruction');
        try {
            this.destroy();
        } catch (error) {
            console.warn('Destruction Error; ' + error);
        }
        instance = null;
    }

}

var instance = null;
module.exports.getBleProvider = function() {
    if (!instance) {
        console.log('Creating ble provider');
        instance = new BleProvider();
    }
    return instance;
};