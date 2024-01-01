const ShipmentContract = artifacts.require('ShipmentContract');

module.exports = function (deployer){
  deployer.deploy(ShipmentContract)
}
