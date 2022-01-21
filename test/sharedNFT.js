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
    let minAuctionBlocks = 3;

    beforeEach(async () => {
      sharedNFTInstance = await sharedNFT.new(NFTName, NFTSymbol, minAuctionBlocks);

      var resultMint = await sharedNFTInstance.mint(accounts[0], 0);
      
      truffleAssert.eventEmitted(resultMint, 'Transfer', (ev) => {
        simleAuctionAddress = ev.auctionContract;
        endAuctionBlockActual = ev.endBlock;
        eventEmitted = true;
        return true;
    });


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
      let result  = await sharedNFTInstance.sell(0, 0, {from: accounts[0]});
      var blockAfterSell = await web3.eth.getBlock("latest");
      var endAuctionBlockExpected = blockAfterSell.number + minAuctionBlocks; 
      var endAuctionBlockActual = 0;
      var eventEmitted = false;
      truffleAssert.eventEmitted(result, 'AuctionStarted', (ev) => {
          simleAuctionAddress = ev.auctionContract;
          endAuctionBlockActual = ev.endBlock;
          eventEmitted = true;
          return true;
      });
      assert(eventEmitted, "Sell Auction notification event has not been emited");
      assert.equal(endAuctionBlockActual, endAuctionBlockExpected, "Auction event should end at an expeted block");
    });

    it('Close an Auction', async () => {
  
        let waitBlocks = 15;

        var resultSell  = await sharedNFTInstance.sell(0, waitBlocks, {from: accounts[0]});

        let blockAfterSell = await web3.eth.getBlock("latest");

        let simleAuctionAddress;

        truffleAssert.eventEmitted(resultSell, 'AuctionStarted', (ev) => {
            simleAuctionAddress = ev.auctionContract;
            return true;
        });

        simleAuctionInstance = await SimpleAuction.at(simleAuctionAddress);
        await simleAuctionInstance.bid({value : 1000000, from : accounts[1]}); 
        let blockBeforeClose = await web3.eth.getBlock("latest")

        mineBlocks(waitBlocks - blockBeforeClose.number + blockAfterSell.number);
        let blockAfterWait = await web3.eth.getBlock("latest")

        var resultClose = await debug(simleAuctionInstance.close());
        const PrimarilyOwner = await sharedNFTInstance.ownerOf(0);
        assert.equal(PrimarilyOwner, accounts[1], "Owner should be account that baught");
        const ownersActual = await sharedNFTInstance.allOwners(0);
        const ownersExpected = [accounts[0], accounts[1]];
        for (let i = 0; i < ownersExpected.length; ++i) {
          assert.equal(ownersActual[i], ownersExpected[i], "Owner %s is set incorrectly");
        };

        // Checking that Transfer event is emitted during the close transaction
        // It seems like a truffle bug - event is not listed in close transaction result 
        // but is catched by getPastEvents with correct transaction hash.
        var fromActual;
        var toActual;
        var fromExpected = accounts[0];
        var toExpected = accounts[1];
        TransferEvents = await sharedNFTInstance.getPastEvents( 'Transfer', { fromBlock: 0, toBlock: 'latest' } );
        var transferInCloseTx = false;
        for (const tevent of TransferEvents) {
            if (tevent.transactionHash == resultClose.tx) {
                transferInCloseTx = true;
                fromActual = tevent.args.from;
                toActual = tevent.args.to;
            }
        };
        assert(transferInCloseTx, "Transfer event has to be emitted during close transaction");
        assert.equal(fromActual, fromExpected, "Transfer event doesnt notify about a correct from address");
        assert.equal(toActual, toExpected, "Transfer event doesnt notify about a correct to address");
    });


});
