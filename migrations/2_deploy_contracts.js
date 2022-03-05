const mandatoryRoyaltyNFT = artifacts.require("MandatoryRoyaltyNFT");

module.exports = function(deployer) {
  deployer.deploy(mandatoryRoyaltyNFT, "Name", "Symbol", "https://mytest/", 2, 100);
};
