const ble_core = require('./../../core/ble_core');
const bleProvider = ble_core.bleProvider();
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function DeviceNode(config) {
        console.debug('Creating DeviceNode');
        RED.nodes.createNode(this, config);

        var node = this;
        var connectionTimeoutInMs = config.timeout * 1000;
        var deviceAddress = config.address.toUpperCase();

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
                node.send([null, {
                    payload: 1,
                    timeout: connectionTimeoutInMs,
                    disconnected: true
                }]);
            }
        }

        function connected() {
            console.info('Device ' + deviceAddress + ' was connected');
            node.status({ fill: 'green', shape: 'ring', text: 'connected' });
        }

        function disconnected(status) {
            console.info('Device ' + deviceAddress + ' was disconnected');

            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
            node.send([null, {
                payload: 1,
                timeout: connectionTimeoutInMs,
                disconnected: true
            }]);
        }

        node.on('input', async function (msg) {
            console.debug('DeviceNode received input message: ' + JSON.stringify(msg));
            connectingStart();
            var _ = await bleProvider.initializeAdapter();
            var device = await bleProvider.waitDevice(deviceAddress,
                connectionTimeoutInMs);
            var connectionSuccess = device != null;
            if (connectionSuccess) {
                console.info('Device ' + await device.toString() + ' was connected');
                device.once('disconnect', disconnected);
                connected();
                await bleDevicesManager.registerDevice(device);
                node.send([{
                    payload: 1,
                    _deviceAddress: deviceAddress
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
            if (bleDevicesManager.isDeviceRegistered(deviceAddress)) {
                var { device, _, _ } = await bleDevicesManager.getDevice(deviceAddress);
                device.removeListener('disconnect', disconnected);
                await bleDevicesManager.removeDevice(deviceAddress);
            }
            done();
        })
    }
    RED.nodes.registerType('device', DeviceNode);
}