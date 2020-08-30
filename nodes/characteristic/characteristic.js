const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function CharacteristicNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.warn("Creating CharacteristicNode");
        node.status({});

		function characteristicStatus(available) {
            if (available) {
                node.status({ fill: "green", shape: "ring", text: "available" });
            } else {
                node.status({ fill: "red", shape: "ring", text: "error" });
            }          
        }
        
        node.on('input', async function(msg) {
            node.warn('input');
            var characteristic = await bleDevicesManager.getCharacteristic(msg._deviceAddress, msg._serviceUuid, config.uuid);
            var characteristicAvailable = characteristic != null;
            characteristicStatus(characteristicAvailable);
            if (characteristicAvailable) {
                node.send({ payload: 1, 
                    _deviceAddress: msg._deviceAddress, 
                    _serviceUuid: msg._serviceUuid, 
                    _characteristicUuid: config.uuid 
                });
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
    RED.nodes.registerType("characteristic", CharacteristicNode);
}