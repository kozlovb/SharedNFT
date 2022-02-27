const SharedNFT = artifacts.require("SharedNFT");

module.exports = function(deployer) {
  deployer.deploy(SharedNFT, "Name", "Symbol", "https://mytest/", 2, 100);
};
