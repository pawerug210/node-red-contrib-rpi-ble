const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function NotifyNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        console.debug('Creating NotifyNode');
        node.status({});
        var characteristic = null;

        function notify(buffer) {
            node.send({ payload: buffer });
        }

        function notifyStatus(success) {
            if (success) {
                node.status({ fill: 'green', shape: 'ring', text: 'subscribed' });
            } else {
                node.status({});
            }
        }

        node.on('input', async function (msg) {
            console.debug('Received input message: ' + msg);
            characteristic = await bleDevicesManager.getCharacteristic(msg._deviceAddress,
                msg._serviceUuid,
                msg._characteristicUuid);

            if (characteristic != null) {
                if (!characteristic.listeners('valuechanged').includes(notify)) {
                    console.info('Registering callback for notifications on characteristic ' + msg._characteristicUuid +
                        ' from service ' + msg._serviceUuid +
                        ' from device ' + msg._deviceAddress);
                    characteristic.on('valuechanged', notify);
                }
                var subscribeSuccess = await bleDevicesManager.startNotifications(characteristic);
                notifyStatus(subscribeSuccess);
                if (config.period > 0) {
                    setTimeout(async function () {
                        await bleDevicesManager.stopNotifications(characteristic);
                        notifyStatus(false);
                    }, config.period * 1000);
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
            if (characteristic != null) {
                characteristic.removeListener('valuechanged', notify);
            }
            done();
        })
    }
    RED.nodes.registerType('notify', NotifyNode);
}