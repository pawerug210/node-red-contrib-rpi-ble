const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function WriteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.debug('Creating WriteNode');

        var characteristic = null;

        node.status({});

        function resetStatus(delayInSeconds) {
            setTimeout(function() {
                node.status({});
			}, delayInSeconds * 1000);
        }

        node.on('error', function() {
            node.error('Node error occured');
        })

        node.on('input', async function (msg) {
            node.debug('WriteNode received input message: ' + JSON.stringify(msg));

            if ('disconnected' in msg) {
                characteristic = null;
                node.status({});
                return;
            }

            if (characteristic) {
                try {
                    await characteristic.writeValue(Buffer.from(msg.payload));
                    node.status({ fill: 'green', shape: 'ring', text: 'success' });
                } catch (error) {
                    node.error('Writing to characteristic error: ' + error);
                    node.status({ fill: 'red', shape: 'ring', text: 'error' });
                }
                resetStatus(2);
            } else {
                node.log('Characteristic not yet initialized, trying to retrieve it..');
                try {
                    characteristic = await bleDevicesManager.getCharacteristic(msg._deviceAddress,
                        msg._serviceUuid,
                        msg._characteristicUuid);
                } catch (error) {
                    node.error('Cannot write to unknown characteristic, initialize it first');
                    node.log('Writing to uninitialized characteristic returned error: ' + error);
                }
            }
        })

        node.on('close', async function (removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                node.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                node.debug('Node is closing as it going to be restarted');
            }
            done();
        })
    }
    RED.nodes.registerType('write', WriteNode);
}