const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function WriteNode(config) {
        console.debug('Creating WriteNode');
        RED.nodes.createNode(this, config);

        var node = this;
        var characteristic = null;

        node.status({});

        function resetStatus(delayInSeconds) {
            setTimeout(function() {
                node.status({});
			}, delayInSeconds * 1000);
        }

        node.on('input', async function (msg) {
            console.debug('WriteNode received input message: ' + JSON.stringify(msg));

            if (characteristic) {
                try {
                    await characteristic.writeValue(Buffer.from(msg.payload));
                    node.status({ fill: 'green', shape: 'ring', text: 'success' });
                } catch (error) {
                    console.error('Writing to characteristic error: ' + error);
                    node.status({ fill: 'red', shape: 'ring', text: 'error' });
                }
                resetStatus(2);
            } else {
                console.info('Characteristic not yet initialized, trying to retrieve it..');
                try {
                    characteristic = await bleDevicesManager.getCharacteristic(msg._deviceAddress,
                        msg._serviceUuid,
                        msg._characteristicUuid);
                } catch (error) {
                    node.error('Cannot write to unknown characteristic, initialize it first');
                    console.error('Writing to uninitialized characteristic returned error: ' + error);
                }
            }
        })

        node.on('close', async function (removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                console.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                console.debug('Node is closing as it going to be restarted');
            }
            done();
        })
    }
    RED.nodes.registerType('write', WriteNode);
}