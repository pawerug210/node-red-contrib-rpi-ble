const node_ble = require('node-ble');

module.exports = function(RED) {
    function DeviceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});

        const createBluetooth = node_ble.createBluetooth();
        const bluetooth = createBluetooth.bluetooth;
        const destroy = createBluetooth.destroy;

        function connectingStart() {
            node.warn('Connecting started');
			node.status({ fill: "blue", shape: "ring", text: "connecting" });
		}

		function connectingStop(success) {
            node.warn('Connecting stopped');
            if (success) {
                node.status({ fill: "green", shape: "ring", text: "connected" });
                node.send({ payload: 1 });
            } else {
                node.status({ fill: "red", shape: "ring", text: "error" });
                node.send({ payload: 0 });
            }          
        }
        
        node.on('input', async function(msg) {
            node.warn('input');
            connectingStart();
            var adapter = await bluetooth.defaultAdapter();
            var device = null;
            try {
                device = await adapter.waitDevice(config.address.toUpperCase(), config.timeout * 1000);
                await device.connect();
            } catch (error) {
                node.warn("Connection Error" + error);
            }
            connectingStop(device != null);
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
            destroy();
            done();
        })
    }
    RED.nodes.registerType("device", DeviceNode);
}