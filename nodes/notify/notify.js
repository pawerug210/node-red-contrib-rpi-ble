const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function NotifyNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.warn("Creating NotifyNode");
        node.status({});

        function notify(buffer) {
            node.send({ payload: buffer });
        }
        
        function notifyStatus(success) {
            if (success) {
                node.status({ fill: "green", shape: "ring", text: "subscribed" });
            } else {
                node.status({});
            }          
        }

        node.on('input', async function(msg) {
            node.warn('input');
            var subscribeSuccess = await bleDevicesManager.subscribeCharacteristic(
                msg._deviceAddress, 
                msg._serviceUuid, 
                msg._characteristicUuid,
                notify);
            notifyStatus(subscribeSuccess);
            if (config.period > 0) {
                setTimeout(async function() {
                    await bleDevicesManager.stopSubscribing(
                        msg._deviceAddress, 
                        msg._serviceUuid, 
                        msg._characteristicUuid);
                    notifyStatus(false);
                }, config.period * 1000);
            }
        })

        node.on('close', async function(removed, done) {
            node.warn('close');
            if (removed) {
                // This node has been disabled/deleted
                node.warn('removed');
            } else {
                // This node is being restarted
                node.warn('restarted');
            }
            //bleProvider.destroy();
            done();
        })
    }
    RED.nodes.registerType("notify", NotifyNode);
}