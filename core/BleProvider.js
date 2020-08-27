class BleProvider {
    constructor() {
        const node_ble = require('node-ble');
        console.log("Creating BleProvider");
        var createBluetooth = node_ble.createBluetooth();
        this.bluetooth = createBluetooth.bluetooth;
        this.destroy = createBluetooth.destroy;
        this.adapter = null;
    }

    async initializeAdapter(adapter = null) {
        if (this.adapter == null) {
            if (adapter == null) {
                console.log("creating default adapter");
                this.adapter = await this.bluetooth.defaultAdapter();
            } else {
                console.log("creating specific adapter: " + adapter);
                this.adapter = await this.bluetooth.getAdapter(adapter);
            }
        }
        console.log("adapter initialized");
        return this.adapter;
    }

    async startDiscovery() {
        //todo: timeout
        if (! await this.adapter.isDiscovering()) {
            await this.adapter.startDiscovery();
        }
    }

    async stopDiscovery() {
        if (await this.adapter.isDiscovering()) {
            await this.adapter.stopDiscovery();
        }
    }

    async waitDevice(address, timeout) {
        var device = null;
        try {
            device = await this.adapter.waitDevice(address.toUpperCase(), timeout);
            await device.connect();
        } catch (error) {
            console.log("Connection Error" + error);
            device = null;
        }
        return device;
    }

    destroy() {
        console.log("destroying");
        try {
            this.destroy();
        }
        catch (error) {
            console.log("Connection Error" + error);
        }
        instance = null;
    }

}

var instance = null;
module.exports.getBleProvider = function() {
    if (!instance) {
        console.log("Creating ble provider");
        instance = new BleProvider();
    }
    return instance;
};