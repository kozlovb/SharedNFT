const sharedNFT = artifacts.require("SharedNFT");
const SimpleAuction = artifacts.require("SimpleAuction");
const interfaceID = artifacts.require("InterfaceID");
const truffleAssert = require('truffle-assertions');
const util = require('util')
const common = require('./common/common');

// An example of gas estimate:
// const gasEstimate = await simleAuctionInstance.close.estimateGas();
// console.log("gasEstimate %s", gasEstimate);

//fix variables no capitals

//write md

//todo test nft name

contract('SharedNFT', (accounts) => {

    let sharedNFTInstance;
    const nameNFT = "MyNFT";
    const symbolNFT = "MNFT";
    const baseURI = "https://sharednft/";
    const minAuctionBlocks = 3;
    const minPrice = 1000;

    beforeEach(async () => {

      sharedNFTInstance = await sharedNFT.new(nameNFT, symbolNFT, baseURI, minAuctionBlocks);

      const resultMint = await sharedNFTInstance.mint(accounts[0], 0);
      
      truffleAssert.eventEmitted(resultMint, 'Transfer', (ev) => {
        simleAuctionAddress = ev.auctionContract;
        endAuctionBlockActual = ev.endBlock;
        eventEmitted = true;
        return true;
      });
    });

    it('Check NFT name', async () => {
      const nameNFTActual = await sharedNFTInstance.name();
      assert.equal(nameNFTActual, nameNFT, "NFT name is incorrect");
    });

    it('Check NFT symbol', async () => {
      const symbolNFTActual = await sharedNFTInstance.symbol();
      assert.equal(symbolNFTActual, symbolNFT, "NFT symbol is incorrect");
    });

    it('Check NFT URL', async () => {
       const tokenId = 0;
       const NFTActualURL = await sharedNFTInstance.tokenURI(0);
       const NFTExpectedURL = baseURI + tokenId;
       assert(NFTActualURL, NFTExpectedURL, "The nft url is incorrect"); 
    });

    it('Check Supported ISharedNFT Interface', async () => {
       const interfaceIDInstance = await interfaceID.new();
       assert(await sharedNFTInstance.supportsInterface(await interfaceIDInstance.interfaceID("ISharedNFT")),
       "SharedNFT has to support ISharedNFT");
    });

    it('Check Supported IERC721Metadata Interface', async () => {
      const interfaceIDInstance = await interfaceID.new();
      assert(await sharedNFTInstance.supportsInterface(await interfaceIDInstance.interfaceID("IERC721Metadata")),
       "SharedNFT has to support IERC721Metadata");
    });

    it('Minted token belongs to the authors account', async () => {
     const owner = await sharedNFTInstance.ownerOf(0);
     assert.equal(owner, accounts[0], "Owner should be account that minted");
    });

    it('Organise an Auction', async () => {
      const minPrice = 1000;
      const result  = await sharedNFTInstance.sell(0, 0, minPrice, {from: accounts[0]});
      const blockAfterSell = await web3.eth.getBlock("latest");
      const endAuctionBlockExpected = blockAfterSell.number + minAuctionBlocks; 
      let endAuctionBlockActual = 0;
      truffleAssert.eventEmitted(result, 'AuctionStarted', (ev) => {
          simleAuctionAddress = ev.auctionContract;
          endAuctionBlockActual = ev.endBlock;
          return true;
      }, "Sell Auction notification event has not been emited");
      assert.equal(endAuctionBlockActual, endAuctionBlockExpected, "Auction event should end at an expeted block");
    });

    it('Close an Auction', async () => {
  
        const waitBlocks = 15;

        const resultSell  = await sharedNFTInstance.sell(0, waitBlocks, minPrice, {from: accounts[0]});

        const blockAfterSell = await web3.eth.getBlock("latest");

        let simleAuctionAddress;

        truffleAssert.eventEmitted(resultSell, 'AuctionStarted', (ev) => {
            simleAuctionAddress = ev.auctionContract;
            return true;
        }, "Sell Auction notification event has not been emited");

        let simleAuctionInstance = await SimpleAuction.at(simleAuctionAddress);
        await simleAuctionInstance.bid({value : 1000000, from : accounts[1]}); 
        let blockBeforeClose = await web3.eth.getBlock("latest")

        common.mineBlocks(waitBlocks - blockBeforeClose.number + blockAfterSell.number);

        let resultClose = await debug(simleAuctionInstance.close());
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
        let fromActual;
        let toActual;
        const fromExpected = accounts[0];
        const toExpected = accounts[1];
        TransferEvents = await sharedNFTInstance.getPastEvents( 'Transfer', { fromBlock: 0, toBlock: 'latest' } );
        let transferInCloseTx = false;
        for (const tevent of TransferEvents) {
            if (tevent.transactionHash == resultClose.tx) {
                transferInCloseTx = true;
                fromActual = tevent.args.from;
                toActual = tevent.args.to;
            }
        };
        assert(transferInCloseTx, "Transfer event has to be emitted during close transaction");
        assert.equal(fromActual, fromExpected, "Transfer event doesn't notify about a correct from address");
        assert.equal(toActual, toExpected, "Transfer event doesn't notify about a correct to address");
    });
});
