const SimpleAuction = artifacts.require("SimpleAuction");
const MockedSharedNFT = artifacts.require("MockedSharedNFT");
const truffleAssert = require('truffle-assertions');
const util = require('util');
const commmon = require('./common/common');
  
contract('SimpleAuction', (accounts) => {

    let SimpleAuctionInstance;

    let minAuctionBlocks = 3;

    let tokenId = 0;
    let delayBlocks = 15;
    let blockAfterAuctionConstr = 0;
    let blockSimpleAuction = 0;
    let simpleAuctionInstance;
        

    beforeEach(async () => {
     
      mockedSharedNFTInstance = await MockedSharedNFT.new();
      blockSimpleAuction = (await web3.eth.getBlock("latest")).number;
      simpleAuctionInstance = await SimpleAuction.new(tokenId, mockedSharedNFTInstance.address, delayBlocks);
      blockAfterAuctionConstr = await web3.eth.getBlock("latest")
    });

    it('Check tokenID', async () => {
      tokenIdActual = await simpleAuctionInstance._tokenId();
      assert.equal(tokenIdActual, tokenId, "Token id is wrong");
    });

    it('Check NFT contract', async () => {
      nftContractActual = await simpleAuctionInstance._nftContract();
      assert.equal(nftContractActual, mockedSharedNFTInstance.address, "NFT contract address is wrong");
    });

    it('Check delayBlocks', async () => {
      auctionEndBlockActual = await simpleAuctionInstance._auctionEndBlock();
      console.log("blockSimpleAuction + delayBlocks", blockSimpleAuction + delayBlocks);
      assert.equal(auctionEndBlockActual.toNumber(), blockSimpleAuction + delayBlocks+1, "Auction end block is wrong");
    });

    it('Check successful bid', async () => {
      //todo how to add money and send from certin contract
      //to do test where second bidder bids less, tries blocks etc
      var defaultWinnerExpected = 0x0;
      var expectedWinner = accounts[0];
      var defaultWinnerActual = await simpleAuctionInstance._winner();
      var bidValueExpected  = 1000000;
      assert.equal(defaultWinnerExpected, defaultWinnerActual, "Default winner should be 0 address");
      //todo check gas consumption, gas consumption requiements ?
      await simpleAuctionInstance.bid({value : bidValueExpected, from : accounts[0]}); 
      var winnerActual = await simpleAuctionInstance._winner();
      assert.equal(winnerActual, expectedWinner, "Wrong winner");
      bidValueActual = await simpleAuctionInstance._amount_offered();
      assert.equal(bidValueActual, bidValueExpected, "Offered value is wrong");
    });

    it('Check unsuccessful bid', async () => {
      var expectedWinner = accounts[0];
      var bidValueExpected  = 1000000;
      await simpleAuctionInstance.bid({value : bidValueExpected, from : accounts[0]}); 
      await truffleAssert.reverts(simpleAuctionInstance.bid({value : bidValueExpected - 100, from : accounts[1]})); 
      var winnerActual = await simpleAuctionInstance._winner();
      assert.equal(winnerActual, expectedWinner, "Wrong winner");
      bidValueActual = await simpleAuctionInstance._amount_offered();
      assert.equal(bidValueActual, bidValueExpected, "Offered value is wrong");
    });

    it('Check close', async () => {

      await simpleAuctionInstance.bid({value : 100, from : accounts[0]});
      let blockBeforeClose = await web3.eth.getBlock("latest")
      commmon.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number);
      
      var resultClose = await simpleAuctionInstance.close();
 
    //todo make a function
    TransferEvents = await mockedSharedNFTInstance.getPastEvents( 'Transfer', { fromBlock: 0, toBlock: 'latest' } );
    var transferInCloseTx = false;
    for (const tevent of TransferEvents) {
        if (tevent.transactionHash == resultClose.tx) {
            transferInCloseTx = true;
        }
    };
    assert(transferInCloseTx, "Transfer event has to be emitted during close transaction");
    });

    it('Check unsuccesfull close', async () => {
      await simpleAuctionInstance.bid({value : 100, from : accounts[0]});
      let blockBeforeClose = await web3.eth.getBlock("latest")
      commmon.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number - 1);
      await truffleAssert.reverts(simpleAuctionInstance.close());
    });

});