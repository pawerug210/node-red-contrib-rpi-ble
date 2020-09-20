const ble_core = require('./../../core/ble_core');
const bleProvider = ble_core.bleProvider();
const bleDevicesManager = ble_core.bleDevicesManager();

module.exports = function(RED) {
    function DeviceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        console.debug('Creating DeviceNode');
        node.status({});

        function connectingStart() {
            console.debug('Connecting started');
			node.status({ fill: 'blue', shape: 'ring', text: 'connecting' });
		}

		function connected(status) {
            console.info('Device ' + config.address + ' was connected');
            node.status({ fill: 'green', shape: 'ring', text: 'connected' });        
        }

        function disconnected(status) {
            console.info('Device ' + config.address + ' was disconnected');
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });       
        }
        
        node.on('input', async function(msg) {
            console.debug('Received input message: ' + msg);
            connectingStart();
            var adapter = await bleProvider.initializeAdapter();
            var device = await bleProvider.waitDevice(config.address, 
                config.timeout * 1000,
                connected,
                disconnected);
            var connectionSuccess = device != null;
            if (connectionSuccess) {
                await bleDevicesManager.registerDevice(device);
                node.send({ payload: 1, 
                    _deviceAddress: config.address
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
    RED.nodes.registerType('device', DeviceNode);
}