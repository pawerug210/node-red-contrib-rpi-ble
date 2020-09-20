const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function ServiceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        console.log('Creating ServiceNode');
        node.status({});

		function serviceStatus(available) {
            if (available) {
                node.status({ fill: 'green', shape: 'ring', text: 'available' });
            } else {
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
            }          
        }
        
        node.on('input', async function(msg) {
            console.debug('Received input message: ' + msg);
            var service = await bleDevicesManager.getService(msg._deviceAddress, config.uuid);
            var serviceAvailable = service != null;
            serviceStatus(serviceAvailable);
            if (serviceAvailable) {
                node.send({ payload: 1, 
                    _deviceAddress: msg._deviceAddress, 
                    _serviceUuid: config.uuid
                });
            }
        })

        node.on('close', async function(removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                console.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                console.debug('Node is closing as it going to be restarted');
            }
            //bleProvider.destroy();
            done();
        })
    }
    RED.nodes.registerType("service", ServiceNode);
}