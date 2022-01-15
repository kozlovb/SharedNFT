const sharedNFT = artifacts.require("SharedNFT");
const SimpleAuction = artifacts.require("SimpleAuction");
const truffleAssert = require('truffle-assertions');
const util = require('util')

const mine = async () => await web3.currentProvider.send({
  jsonrpc: '2.0',
  method: 'evm_mine',
  id: new Date().getTime()
}, function (error) {})

function mineBlocks(numberOfBlocks) {
  if (numberOfBlocks <= 0 )
      return;
  for (let i = 0; i < numberOfBlocks; i++) {
    mine();
  }
}

contract('SharedNFT', (accounts) => {

    let sharedNFTInstance;
    let NFTName = "MyNFT";
    let NFTSymbol = "MNFT";

    beforeEach(async () => {
      sharedNFTInstance = await sharedNFT.new(NFTName, NFTSymbol, 1);
      console.log("Deployed contract to %s", sharedNFTInstance.address);
      await sharedNFTInstance.mint(accounts[0], 0);
    });

    it('Check NFT name', async () => {
      NFTNameActual = await sharedNFTInstance.name();
      assert.equal(NFTNameActual, NFTName, "NFT name is wrong");
    });

    it('Check NFT symbol', async () => {
      NFTSymbolActual = await sharedNFTInstance.symbol();
      assert.equal(NFTSymbolActual, NFTSymbol, "NFT symbol is wrong");
    });

    it('Minted token belongs to the authors account', async () => {
     const owner = await sharedNFTInstance.ownerOf(0);
     assert.equal(owner, accounts[0], "Owner should be account that minted");
    });

    it('Organise an Auction', async () => {
  
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
        await simleAuctionInstance.close();  //potentially 8th block
        const PrimarilyOwner = await sharedNFTInstance.ownerOf(0);
        assert.equal(PrimarilyOwner, accounts[1], "Owner should be account that baught");
        const ownersActual = await sharedNFTInstance.allOwners(0);
        const ownersExpected = [accounts[0], accounts[1]];
        for (let i = 0; i < ownersExpected.length; ++i) {
          assert.equal(ownersActual[i], ownersExpected[i], "Owner %s is set incorrectly");
        };
    });


});
