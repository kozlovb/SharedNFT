const sharedNFT = artifacts.require("SharedNFT");
const SimpleAuction = artifacts.require("SimpleAuction");
const interfaceID = artifacts.require("InterfaceID");
const truffleAssert = require('truffle-assertions');
const util = require('util')
const common = require('./common/common');
const BN = require('bn.js');

// An example of gas estimate:
// const gasEstimate = await sharedNFTInstance.ownerOf.estimateGas(0);
// console.log("gasEstimate %s", gasEstimate);

//write md

contract('SharedNFT', (accounts) => {

    let sharedNFTInstance;
    const nameNFT = "MyNFT";
    const symbolNFT = "MNFT";
    const baseURI = "https://sharednft/";
    const minAuctionBlocks = 3;
    const minPrice = 1000;
    const commision = 2000;
  

    beforeEach(async () => {

      sharedNFTInstance = await sharedNFT.new(nameNFT, symbolNFT, baseURI, minAuctionBlocks, commision, {from: accounts[0]});

      const resultMint = await sharedNFTInstance.mint(accounts[1], 0);
      
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
      assert.equal(owner, accounts[1], "Owner should be account that minted");
    });

    it('Organise an Auction', async () => {
      const minPrice = 1000;
      const result  = await sharedNFTInstance.sell(0, 0, minPrice, {from: accounts[1]});
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

        const resultSell  = await sharedNFTInstance.sell(0, waitBlocks, minPrice, {from: accounts[1]});

        const blockAfterSell = await web3.eth.getBlock("latest");

        let simleAuctionAddress;

        const artist_balance = new BN(await web3.eth.getBalance(accounts[0]));
        console.log("Artist balance ");
        console.log(artist_balance.toString());
        const balance1 = await web3.eth.getBalance(accounts[1]);
        const balance2 = await web3.eth.getBalance(accounts[2]);
        
        const bid = 10000000;

        truffleAssert.eventEmitted(resultSell, 'AuctionStarted', (ev) => {
            simleAuctionAddress = ev.auctionContract;
            return true;
        }, "Sell Auction notification event has not been emited");

        let simleAuctionInstance = await SimpleAuction.at(simleAuctionAddress);
        const resultBid = await simleAuctionInstance.bid({value : bid, from : accounts[2]}); 
      

 // Obtain gasPrice from the transaction
 const tx = await web3.eth.getTransaction(resultBid.tx);
 const gasPriceBid = tx.gasPrice;
 console.log(`gasPriceBid: ${gasPriceBid}`);
 console.log("gasPrice web3: " + web3.eth.gasPrice);


        let blockBeforeClose = await web3.eth.getBlock("latest")

        common.mineBlocks(waitBlocks - blockBeforeClose.number + blockAfterSell.number);

        let resultClose = await debug(simleAuctionInstance.close({from: accounts[3]}));
        const owner = await sharedNFTInstance.ownerOf(0, {from: accounts[3]});
        assert.equal(owner, accounts[2], "Owner should be account that baught");

        // Checking that Transfer event is emitted during the close transaction
        // It seems like a truffle bug - event is not listed in close transaction result 
        // but is catched by getPastEvents with correct transaction hash.
        let fromActual;
        let toActual;
        const fromExpected = accounts[1];
        const toExpected = accounts[2];
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

        //check balances
        artist_balance_diff  = (new BN(await web3.eth.getBalance(accounts[0]))).sub(artist_balance);

        artist_balance_diff_exp = bid * (commision/10000); // TODO make precision var
        acc_1_diff = (new BN(await web3.eth.getBalance(accounts[1]))).sub(new BN(balance1));
        acc_1_diff_exp = bid * (1 - commision/10000);  
        
        acc_2_diff = (new BN(await web3.eth.getBalance(accounts[2]))).sub(new BN(balance2));
        console.log("gas used");
        console.log(resultBid.receipt.gasUsed);
        acc_2_diff_exp = - (new BN(bid)).sub( (new BN(gasPriceBid)).mul((new BN(resultBid.receipt.gasUsed))) );
        assert.equal(artist_balance_diff, artist_balance_diff_exp, "Artist didn't recieve correct amount");
        assert.equal(acc_1_diff, acc_1_diff_exp, "Account 1, owner of the NFT, has an incorrect balance after sale even");
        assert.equal(acc_2_diff.toNumber(), acc_2_diff_exp, "Account 2, buyer of the NFT, has an incorrect balance after purchase even");
      });
});
