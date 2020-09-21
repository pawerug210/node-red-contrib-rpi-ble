const ble_core = require('./../../core/ble_core');
const bleProvider = ble_core.bleProvider();
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function DeviceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        console.debug('Creating DeviceNode');
        node.status({});

        function connectingStart() {
            console.debug('Connecting started');
            node.status({ fill: 'blue', shape: 'ring', text: 'connecting' });
        }

        function connectingStatus(success) {
            if (success) {
                node.status({ fill: 'green', shape: 'ring', text: 'connected' });
            } else {
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
                node.send([null, { payload: 1, timeout: config.timeout * 1000 }]);
            }
        }

        function connected() {
            console.info('Device ' + config.address + ' was connected');
            node.status({ fill: 'green', shape: 'ring', text: 'connected' });
        }

        function disconnected(status) {
            console.info('Device ' + config.address + ' was disconnected');
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
            node.send([null, { payload: 1, timeout: config.timeout * 1000 }]);
        }

        node.on('input', async function (msg) {
            console.debug('Received input message: ' + msg);
            connectingStart();
            var _ = await bleProvider.initializeAdapter();
            var device = await bleProvider.waitDevice(config.address,
                config.timeout * 1000,
                disconnected);
            var connectionSuccess = device != null;
            if (connectionSuccess) {
                console.info('Device ' + await device.toString() + ' was connected');
                device.once('disconnect', disconnected);
                connected();
                await bleDevicesManager.registerDevice(device);
                node.send([{
                    payload: 1,
                    _deviceAddress: config.address
                }, null]);
            }
            connectingStatus(connectionSuccess);
        })

        node.on('close', async function (removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                console.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                console.debug('Node is closing as it going to be restarted');
            }
            var { device, _, _ } = await bleDevicesManager.getDevice(config.address);
            device.removeListener('disconnect', disconnected);
            done();
        })
    }
    RED.nodes.registerType('device', DeviceNode);
}