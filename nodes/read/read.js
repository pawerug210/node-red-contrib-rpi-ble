const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function ReadNode(config) {
        node.log('Creating ReadNode');
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
            node.log('ReadNode received input message: ' + JSON.stringify(msg));

            if (characteristic) {
                try {
                    msg.payload = await characteristic.readValue();
                    node.status({ fill: 'green', shape: 'ring', text: 'success' });
                    node.send(msg);
                } catch (error) {
                    node.error('Reading from characteristic error: ' + error);
                    node.status({ fill: 'red', shape: 'ring', text: 'error' });
                }
                resetStatus(2);
            } else {
                node.info('Characteristic not yet initialized, trying to retrieve it..');
                try {
                    characteristic = await bleDevicesManager.getCharacteristic(msg._deviceAddress,
                        msg._serviceUuid,
                        msg._characteristicUuid);
                    if (config.read) {
                        msg.payload = await characteristic.readValue();
                        node.status({ fill: 'green', shape: 'ring', text: 'success' });
                        node.send(msg);
                        resetStatus(2);
                    }
                } catch (error) {
                    node.error('Cannot read from unknown characteristic, initialize it first');
                    node.log('Reading from uninitialized characteristic returned error: ' + error);
                }
            }
        })

        node.on('close', async function (removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                node.log('Node is closing as it got removed');
            } else {
                // This node is being restarted
                node.log('Node is closing as it going to be restarted');
            }
            done();
        })
    }
    RED.nodes.registerType('read', ReadNode);
}