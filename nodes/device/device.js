const ble_core = require('./../../core/ble_core');
const bleProvider = ble_core.bleProvider();
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function DeviceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.debug('Creating DeviceNode');

        var connectionTimeoutInMs = config.timeout * 1000;
        var deviceAddress = config.address.toUpperCase();

        node.status({});

        function connectingStart() {
            node.debug('Connecting started');
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
            node.log('Device ' + deviceAddress + ' was connected');
            node.status({ fill: 'green', shape: 'ring', text: 'connected' });
        }

        function disconnected(status) {
            node.log('Device ' + deviceAddress + ' was disconnected');
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
            node.send([null, {
                payload: 1,
                timeout: connectionTimeoutInMs,
                disconnected: true
            }]);
        }

        node.on('error', function () {
            node.error('Node error occured');
        })

        node.on('input', async function (msg) {
            node.debug('DeviceNode received input message: ' + JSON.stringify(msg));
            connectingStart();
            var _ = await bleProvider.initializeAdapter();
            var device = await bleProvider.waitDevice(deviceAddress,
                connectionTimeoutInMs);
            var connectionSuccess = device != null;
            if (connectionSuccess) {
                device.once('disconnect', disconnected);
                node.debug('Disconnection events listeners number for device ' + deviceAddress
                    + ' is ' + device.listenerCount('disconnect'))
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
                node.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                node.debug('Node is closing as it going to be restarted');
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