var bleProvider = require('./BleProvider');
var bleDevicesManager = require('./BleDevicesManager');

module.exports.bleProvider = bleProvider.getBleProvider;
module.exports.bleDevicesManager = bleDevicesManager.getBleDevicesManager;