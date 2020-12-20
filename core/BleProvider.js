const logger = require('EasyLogger').logger;

class BleProvider {
    constructor() {
        const node_ble = require('node-ble');
        logger.debug('Creating BleProvider');
        var createBluetooth = node_ble.createBluetooth();
        this.bluetooth = createBluetooth.bluetooth;
        this.destroy = createBluetooth.destroy;
        this.adapter = null;
    }

    async initializeAdapter(adapter = null) {
        if (!this.adapter) {
            try {
                if (adapter == null) {
                    logger.info('Creating default adapter');
                    this.adapter = await this.bluetooth.defaultAdapter();
                } else {
                    logger.info('Creating specific adapter: ' + adapter);
                    this.adapter = await this.bluetooth.getAdapter(adapter);
                }
            }
            catch (error) {
                logger.warn('Creating adapter error; ' + error);
            }
        } else {
            logger.debug('adapter already initialized');
        }
        return this.adapter;
    }

    async startDiscovery() {
        //todo: timeout
        if (! (await this.adapter.isDiscovering())) {
            logger.info('Starting adapter discovery');
            await this.adapter.startDiscovery();
        } else {
            logger.debug('Trying to start adapter discovery but it was already discovering');
        }
    }

    async stopDiscovery() {
        if (await this.adapter.isDiscovering()) {
            logger.info('Stopping adapter discovery');
            await this.adapter.stopDiscovery();
        } else {
            logger.debug('Trying to stop adapter discovery but it was not in discovering');
        }
    }

    async waitDevice(address, timeout) {
        address = address.toUpperCase();
        var device = null;

        logger.info('Requesting connection with device ' + address);
        try {
            device = await this.adapter.waitDevice(address, timeout);
            logger.info('Device ' + address +' found, trying to connect...');           
            await device.connect();
        } catch (error) {
            logger.warn('Connection to device ' + address + ' error; ' + error);
            device = null;
        }
        return device;
    }

    destroy() {
        logger.debug('Requesting BT stream destruction');
        try {
            this.destroy();
        } catch (error) {
            logger.warn('Destruction Error; ' + error);
        }
        instance = null;
    }

}

var instance = null;
module.exports.getBleProvider = function() {
    if (!instance) {
        logger.debug('Creating ble provider');
        instance = new BleProvider();
    }
    return instance;
};