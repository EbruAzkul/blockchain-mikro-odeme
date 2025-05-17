const MicroPayment = artifacts.require("MicroPayment");

module.exports = function (deployer) {
  deployer.deploy(MicroPayment);
};