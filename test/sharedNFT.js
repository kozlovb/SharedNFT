const sharedNFT = artifacts.require("SharedNFT");
const SimpleAuction = artifacts.require("SimpleAuction");
const truffleAssert = require('truffle-assertions');
const util = require('util')


function mineBlocks(numberOfBlocks) {
  if (numberOfBlocks <= 0 )
      return;
  for (let i = 0; i < numberOfBlocks; i++) {
    mine();
  }
}

const mine = async () => await web3.currentProvider.send({
  jsonrpc: '2.0',
  method: 'evm_mine',
  id: new Date().getTime()
}, function (error) {})

contract('SharedNFT', (accounts) => {
    it('should mint a token', async () => {
      const sharedNFTInstance = await sharedNFT.deployed();
      //{from: accounts[0]}
      await sharedNFTInstance.mint(accounts[0], 0);
      const owner = await sharedNFTInstance.ownerOf(0);
      assert.equal(owner, accounts[0], "Owner should be account that minted");
    });
    it('Should sell a token', async () => {
        const sharedNFTInstance = await sharedNFT.deployed();
        let waitBlocks = 15;

        let result  = await sharedNFTInstance.sell(0, waitBlocks, {from: accounts[0]});

        let blockAfterSell = await web3.eth.getBlock("latest");

        let simleAuctionAddress;
        truffleAssert.eventEmitted(result, 'AuctionStarted', (ev) => {
            simleAuctionAddress = ev.auctionContract;
            return true;
        });
        simleAuctionInstance = await SimpleAuction.at(simleAuctionAddress);
        await simleAuctionInstance.bid({value : 1000000, from : accounts[1]}); 
        let blockBeforeClose = await web3.eth.getBlock("latest")
        console.log("blockBeforeClose %s", blockBeforeClose.number);
        mineBlocks(waitBlocks - blockBeforeClose.number + blockAfterSell.number);
        let blockAfterWait = await web3.eth.getBlock("latest")
        console.log("blockAfterWait %s", blockAfterWait.number);
       
        await debug(simleAuctionInstance.close());  //potentially 8th block
        const owner = await sharedNFTInstance.ownerOf(0);
        assert.equal(owner, accounts[1], "Owner should be account that baught");

    });
});
