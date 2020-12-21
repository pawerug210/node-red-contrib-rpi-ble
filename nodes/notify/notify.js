const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function (RED) {
    function NotifyNode(config) {
        RED.nodes.createNode(this, config);        
        var node = this;

        node.debug('Creating NotifyNode');

        var characteristic = null;

        node.status({});

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

        node.on('error', function() {
            node.error('Node error occured');
        })

        node.on('input', async function (msg) {
            node.debug('NotifyNode received input message: ' + JSON.stringify(msg));

            if ('disconnected' in msg) {
                node.status({});
                node.send(msg);
                return;
            }

            characteristic = await bleDevicesManager.getCharacteristic(msg._deviceAddress,
                msg._serviceUuid,
                msg._characteristicUuid);

            if (characteristic) {
                if (!characteristic.listeners('valuechanged').includes(notify)) {
                    node.log('Registering callback for notifications on characteristic ' + msg._characteristicUuid +
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
                node.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                node.debug('Node is closing as it going to be restarted');
            }
            if (characteristic) {
                characteristic.removeListener('valuechanged', notify);
                await bleDevicesManager.stopNotifications(characteristic);
            }
            done();
        })
    }
    RED.nodes.registerType('notify', NotifyNode);
}