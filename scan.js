const node_ble = require('node-ble');
const createBluetooth = node_ble.createBluetooth();
const bluetooth = createBluetooth.bluetooth;
const destroy = createBluetooth.destroy;
const adapter = await bluetooth.defaultAdapter();

module.exports = function(RED) {
    function ScanNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        function scanStart() {
            node.warn('scanStart');
			node.status({ fill: "blue", shape: "ring", text: "scanning" });
		}

		function scanStop() {
            node.warn('scanStop');
			node.status({});
        }
        
        node.on('input', function(msg) {
            node.warn('input');
            if (! await adapter.isDiscovering()) {
                await adapter.startDiscovery();
                scanStart();
            }
            setTimeout(function() {
                var devices = await adapter.devices();
                node.warn(devices);
                await adapter.stopDiscovery();
                scanStop();
			}, config.timeout);
        })

        node.on('close', function(removed, done) {
            node.warn('close');
            if (removed) {
                // This node has been disabled/deleted
                node.warn('removed');
            } else {
                // This node is being restarted
                node.warn('restarted');
            }
            await adapter.stopDiscovery();
            destroy();
            done();
        })
    }
    RED.nodes.registerType("scan", ScanNode);
}