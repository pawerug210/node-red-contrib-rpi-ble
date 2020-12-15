const ble_core = require('./../../core/ble_core');
const bleProvider = ble_core.bleProvider();
    
module.exports = function(RED) {
    function DiscovernNode(config) {
        node.debug('Creating DiscoverNode');
        RED.nodes.createNode(this, config);
        
        var node = this;

        function discoverStart() {
            node.debug('Discovery started');
			node.status({ fill: 'blue', shape: 'ring', text: 'discovering' });
		}

		function discoverStop() {
            node.debug('Discovery stopped');
            node.status({});
            node.send({ payload: 1 });
        }
        
        node.on('input', async function(msg) {
            node.debug('DiscoverNode received input message: ' + JSON.stringify(msg));
            await bleProvider.initializeAdapter();
            await bleProvider.startDiscovery();
            discoverStart();
            setTimeout(async function() {
                await bleProvider.stopDiscovery();
                discoverStop();
			}, config.timeout * 1000);
        })

        node.on('close', async function(removed, done) {
            if (removed) {
                // This node has been disabled/deleted
                node.debug('Node is closing as it got removed');
            } else {
                // This node is being restarted
                node.debug('Node is closing as it going to be restarted');
            }
            //todo: maybe useless if destroy after
            //await bleProvider.stopDiscovery();
            //bleProvider.destroy();
            done();
        })
    }
    RED.nodes.registerType('discover', DiscovernNode);
}