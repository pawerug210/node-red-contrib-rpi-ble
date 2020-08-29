const ble_core = require('./../../core/ble_core');
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function ServiceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.warn("Creating ServiceNode");
        node.status({});

		function serviceStatus(available) {
            if (available) {
                node.status({ fill: "green", shape: "ring", text: "available" });
            } else {
                node.status({ fill: "red", shape: "ring", text: "error" });
            }          
        }
        
        node.on('input', async function(msg) {
            node.warn('input');
            var service = await bleDevicesManager.getService(msg._deviceAddress, config.serviceUuid);
            var serviceAvailable = service != null;
            serviceStatus(serviceAvailable);
            if (serviceAvailable) {
                node.send({ payload: 1, 
                    _deviceAddress: msg._deviceAddress, 
                    _serviceUuid: config.serviceUuid
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
    RED.nodes.registerType("service", ServiceNode);
}