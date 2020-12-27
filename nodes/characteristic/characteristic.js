const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function CharacteristicNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
    
        node.debug('Creating CharacteristicNode');
        
        node.status({});

		function characteristicStatus(available) {
            if (available) {
                node.status({ fill: 'green', shape: 'ring', text: 'available' });
            } else {
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
            }          
        }

        node.on('error', function() {
            node.error('Node error occured');
        })
        
        node.on('input', async function(msg) {
            node.debug('CharacteristicNode received input message: ' + JSON.stringify(msg));

            if ('disconnected' in msg) {
                node.status({});
                node.send(msg);
                return;
            }
            
            try {
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
            } catch (error) {
                characteristicStatus(false);
                node.error('Getting characteristic ' + config.uuid + ' returned error; ' + error);
            }
        })

        node.on('close', async function(removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                node.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                node.debug('Node is closing as it going to be restarted');
            }
            //bleProvider.destroy();
            done();
        })
    }
    RED.nodes.registerType('characteristic', CharacteristicNode);
}