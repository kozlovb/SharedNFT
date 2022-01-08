const SharedNFT = artifacts.require("SharedNFT");

module.exports = function(deployer) {
  deployer.deploy(SharedNFT, "Privet", "Poka", 2);
};
