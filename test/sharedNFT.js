const sharedNFT = artifacts.require("SharedNFT");
const SimpleAuction = artifacts.require("SimpleAuction");
const truffleAssert = require('truffle-assertions');
const util = require('util')


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
        let block = await web3.eth.getBlock("latest")
        console.log("Block before sell %s", block.number);
        let result  = await sharedNFTInstance.sell(0, {from: accounts[0]});
        let simleAuctionAddress;
        truffleAssert.eventEmitted(result, 'AuctionStarted', (ev) => {
            simleAuctionAddress = ev.auctionContract;
            return true;
        });
        simleAuctionInstance = await SimpleAuction.at(simleAuctionAddress);
        await simleAuctionInstance.bid({value : 1000000, from : accounts[1]}); 
        block = await web3.eth.getBlock("latest")
        console.log(block.number)
        console.log("Block before close %s", block.number);
        mine();
        await simleAuctionInstance.close();
        const owner = await sharedNFTInstance.ownerOf(0);
        assert.equal(owner, accounts[1], "Owner should be account that baught");

    });
});
