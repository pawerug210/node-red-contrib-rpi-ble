const node_ble = require('node-ble');

module.exports = function(RED) {
    function DiscovernNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const createBluetooth = node_ble.createBluetooth();
        const bluetooth = createBluetooth.bluetooth;
        const destroy = createBluetooth.destroy;

        function discoverStart() {
            node.warn('Discovery started');
			node.status({ fill: "blue", shape: "ring", text: "discovering" });
		}

		function discoverStop() {
            node.warn('Discovery stopped');
            node.status({});
            node.send({ payload: 1 });
        }
        
        node.on('input', async function(msg) {
            node.warn('input');
            var adapter = await bluetooth.defaultAdapter();
            if (! await adapter.isDiscovering()) {
                await adapter.startDiscovery();
                discoverStart();
            }
            setTimeout(async function() {
                var devices = await adapter.devices();
                node.warn(devices);
                await adapter.stopDiscovery();
                discoverStop();
			}, config.timeout * 1000);
        })

        node.on('close', async function(removed, done) {
            node.warn('close');
            var adapter = await bluetooth.defaultAdapter();
            if (removed) {
                // This node has been disabled/deleted
                node.warn('removed');
            } else {
                // This node is being restarted
                node.warn('restarted');
            }
            if (await adapter.isDiscovering()) {
                await adapter.stopDiscovery();
            }
            destroy();
            done();
        })
    }
    RED.nodes.registerType("discover", DiscovernNode);
}