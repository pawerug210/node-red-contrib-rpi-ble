const ble_core = require('./../../core/ble_core');
const bleProvider = ble_core.bleProvider();
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function DeviceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.warn("Creating DeviceNode");
        node.status({});

        function connectingStart() {
            node.warn('Connecting started');
			node.status({ fill: "blue", shape: "ring", text: "connecting" });
		}

		function connectingStatus(success) {
            node.warn('Connecting stopped');
            if (success) {
                node.status({ fill: "green", shape: "ring", text: "connected" });
            } else {
                node.status({ fill: "red", shape: "ring", text: "error" });
            }          
        }
        
        node.on('input', async function(msg) {
            node.warn('input');
            connectingStart();
            var adapter = await bleProvider.initializeAdapter();
            var device = await bleProvider.waitDevice(config.address, config.timeout * 1000);
            var connectionSuccess = device != null;
            if (connectionSuccess) {
                await bleDevicesManager.registerDevice(device);
                node.send({ payload: 1, 
                    _deviceAddress: config.address
                });
            }
            connectingStatus(connectionSuccess);
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
    RED.nodes.registerType("device", DeviceNode);
}