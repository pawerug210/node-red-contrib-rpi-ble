class BleProvider {
    constructor() {
        const node_ble = require('node-ble');
        var createBluetooth = node_ble.createBluetooth();
        this.bluetooth = createBluetooth.bluetooth;
        this.destroy = createBluetooth.destroy;
        this.adapter = null;
    }

    async initializeAdapter(adapter = null) {
        if (adapter = null) {
            this.adapter = await this.bluetooth.defaultAdapter();
        } else {
            this.adapter = await this.bluetooth.getAdapter(adapter);
        }
        return this.adapter;
    }

    async startDiscovery(timeout) {
        if (! await adapter.isDiscovering()) {
            await this.adapter.startDiscovery();
        }
    }

    async stopDiscovery() {
        if (await this.adapter.isDiscovering()) {
            await this.adapter.stopDiscovery();
        }
    }

    destroy() {
        this.destroy();
    }
}

module.exports.getBleProvider = function() {
    return new BleProvider();
}