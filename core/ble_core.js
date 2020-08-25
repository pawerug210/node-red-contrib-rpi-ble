const bleProvider = require('./BleProvider').getBleProvider();
const bleDevicesManager = require('./BleDevicesManager').getBleDevicesManager();

module.exports.bleProvider = bleProvider;
module.exports.bleDevicesManager = bleDevicesManager;