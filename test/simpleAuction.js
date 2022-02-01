const SimpleAuction = artifacts.require("SimpleAuction");
const MockedSharedNFT = artifacts.require("MockedSharedNFT");
const truffleAssert = require('truffle-assertions');
const util = require('util');
const commmon = require('./common/common');
const BN = require('bn.js');
  
contract('SimpleAuction', (accounts) => {

    let SimpleAuctionInstance;

    let minAuctionBlocks = 3;

    let tokenId = 0;
    let delayBlocks = 15;
    let blockAfterAuctionConstr = 0;
    let blockSimpleAuction = 0;
    let simpleAuctionInstance;
    let minBid = BigInt(Math.pow(10, 18));

    beforeEach(async () => {
      mockedSharedNFTInstance = await MockedSharedNFT.new();
      blockSimpleAuction = (await web3.eth.getBlock("latest")).number;
      simpleAuctionInstance = await SimpleAuction.new(tokenId, mockedSharedNFTInstance.address, delayBlocks, minBid);
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
      //todo how to add money and send from certain contract
      //to do test where second bidder bids less, tries blocks etc
      var defaultWinnerExpected = 0x0;
      var expectedWinner = accounts[0];
      var defaultWinnerActual = await simpleAuctionInstance._maxBid();
      var bidValueExpected  = 1000000;
      assert.equal(defaultWinnerExpected, defaultWinnerActual, "Default winner should be 0 address");
      //todo check gas consumption, gas consumption requiements ?
      await simpleAuctionInstance.bid({value : bidValueExpected, from : accounts[0]}); 
      var winnerActual = await simpleAuctionInstance._winner();
      assert.equal(winnerActual, expectedWinner, "Wrong winner");
      bidValueActual = await simpleAuctionInstance._maxBid();
      assert.equal(bidValueActual, bidValueExpected, "Offered value is wrong");
    });

    //need to check bid container instead
    it('Check bids', async () => {
      var expectedWinner = accounts[0];
      var account0BidExp  = minBid + BigInt(100);
      var account1BidA = account0BidExp/BigInt(2) - BigInt(1);
      var account1BidB = account0BidExp/BigInt(2) - BigInt(1);
      var account1BidExp  = account1BidA + account1BidB;

      await simpleAuctionInstance.bid({ value : new BN(account0BidExp), from : accounts[0]}); 
      await simpleAuctionInstance.bid({value : new BN(account1BidExp), from : accounts[1]}); 

      var account0BidAct = await simpleAuctionInstance._bids(accounts[0]);
      assert.equal(account0BidAct, account0BidExp, "Wrong bid for 0 account");
      var account1BidAct = await simpleAuctionInstance._bids(accounts[0]);
      assert.equal(account1BidAct, account0BidExp, "Wrong bid for 1st account");


      var winnerActual = await simpleAuctionInstance._winner();
      assert.equal(winnerActual, expectedWinner, "Wrong winner");
      maxBidActual = await simpleAuctionInstance._maxBid();
      assert.equal(maxBidActual, account0BidExp, "Offered value is wrong");
    });

    it('Check unsuccesfull close', async () => {
      await simpleAuctionInstance.bid({value : new BN(minBid + BigInt(100)), from : accounts[0]});
      let blockBeforeClose = await web3.eth.getBlock("latest");
      commmon.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number - 1);
      await truffleAssert.reverts(simpleAuctionInstance.close());
    });

    it('Check close with less than min allowed bid', async () => {
      await simpleAuctionInstance.bid({value : new BN(minBid/BigInt(2)), from : accounts[0]});
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
      assert(!transferInCloseTx, "Transfer event should not be emitted during close transaction");
    });

    it('Check close', async () => {
      await simpleAuctionInstance.bid({value : new BN(minBid + BigInt(100)), from : accounts[0]});
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

    //available only after bid
    it('Check withdrawal', async () => {
      var balance0 = await web3.eth.getBalance(accounts[0]);
      var balance1 = await web3.eth.getBalance(accounts[1]);

      await simpleAuctionInstance.bid({value : new BN(minBid + BigInt(100)), from : accounts[0]});
      await simpleAuctionInstance.bid({value : new BN(minBid + BigInt(100)), from : accounts[1]});
      let blockBeforeClose = await web3.eth.getBlock("latest");
      commmon.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number);
      await debug(simpleAuctionInstance.close());
      await simpleAuctionInstance.withdraw({from : accounts[0]});
      await simpleAuctionInstance.withdraw({from : accounts[1]});

      balanceDiff0 = balance0 - (await web3.eth.getBalance(accounts[0]));
      balanceDiff1 = balance1 - (await web3.eth.getBalance(accounts[1]));

      assert(balanceDiff0 > minBid + BigInt(100), "Account0 should have spent funds on the item");
      assert(balanceDiff1 < minBid + BigInt(100), "Account1 should have kept his funds except gas");
    });
});