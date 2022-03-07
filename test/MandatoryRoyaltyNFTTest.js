const MandatoryRoyaltyNFT = artifacts.require("MandatoryRoyaltyNFT")
const SimpleAuction = artifacts.require("SimpleAuction")
const interfaceID = artifacts.require("InterfaceID")
const truffleAssert = require('truffle-assertions')
const util = require('util')
const common = require('./common/common')
const BN = require('bn.js')

// An example of gas estimate:
// const gasEstimate = await mandatoryRoyaltyNFTInstance.ownerOf.estimateGas(0)
// console.log("gasEstimate %s", gasEstimate)

contract('MandatoryRoyaltyNFT', (accounts) => {

    let mandatoryRoyaltyNFTInstance
    const nameNFT = "MyNFT"
    const symbolNFT = "MNFT"
    const baseURI = "https://MandatoryRoyaltyNft/"
    const minAuctionBlocks = 3
    const minPrice = 1000
    const commision = 2000
    const precision = 10000
  

    beforeEach(async () => {

      mandatoryRoyaltyNFTInstance = await MandatoryRoyaltyNFT.new(nameNFT, symbolNFT, baseURI, minAuctionBlocks, commision, {from: accounts[0]})

      const resultMint = await mandatoryRoyaltyNFTInstance.mint(accounts[1], 0, {from: accounts[0]})
      
      truffleAssert.eventEmitted(resultMint, 'Transfer', (ev) => {
        simleAuctionAddress = ev.auctionContract
        endAuctionBlockActual = ev.endBlock
        eventEmitted = true
        return true
      })
    })

    it('Check NFT name', async () => {
      const nameNFTActual = await mandatoryRoyaltyNFTInstance.name()
      assert.equal(nameNFTActual, nameNFT, "NFT name is incorrect")
    })

    it('Check NFT symbol', async () => {
      const symbolNFTActual = await mandatoryRoyaltyNFTInstance.symbol()
      assert.equal(symbolNFTActual, symbolNFT, "NFT symbol is incorrect")
    })

    it('Check NFT URL', async () => {
       const tokenId = 0
       const NFTActualURL = await mandatoryRoyaltyNFTInstance.tokenURI(0)
       const NFTExpectedURL = baseURI + tokenId
       assert(NFTActualURL, NFTExpectedURL, "The nft url is incorrect") 
    })

    it('Check Supported IMandatoryRoyaltyNFT Interface', async () => {
       const interfaceIDInstance = await interfaceID.new()
       assert(await mandatoryRoyaltyNFTInstance.supportsInterface(await interfaceIDInstance.interfaceID("IMandatoryRoyaltyNFT")),
       "MandatoryRoyaltyNFT has to support IMandatoryRoyaltyNFT")
    })

    it('Check Supported IERC721Metadata Interface', async () => {
      const interfaceIDInstance = await interfaceID.new()
      assert(await mandatoryRoyaltyNFTInstance.supportsInterface(await interfaceIDInstance.interfaceID("IERC721Metadata")),
       "MandatoryRoyaltyNFT has to support IERC721Metadata")
    })

    it('Minted token belongs to the authors account', async () => {
      const owner = await mandatoryRoyaltyNFTInstance.ownerOf(0)
      assert.equal(owner, accounts[1], "Owner should be account that minted")
    })

    it('Organise an Auction', async () => {
      const minPrice = 1000
      const result  = await mandatoryRoyaltyNFTInstance.sell(0, 0, minPrice, {from: accounts[1]})
      const blockAfterSell = await web3.eth.getBlock("latest")
      const endAuctionBlockExpected = blockAfterSell.number + minAuctionBlocks 
      let endAuctionBlockActual = 0
      truffleAssert.eventEmitted(result, 'AuctionStarted', (ev) => {
          simleAuctionAddress = ev.auctionContract
          endAuctionBlockActual = ev.endBlock
          return true
      }, "Sell Auction notification event has not been emited")
      assert.equal(endAuctionBlockActual, endAuctionBlockExpected, "Auction event should end at an expeted block")
    })

    it('Close an Auction', async () => {
  
        const waitBlocks = 15
        let simleAuctionAddress
        const bid = 10000000
        const resultSell  = await mandatoryRoyaltyNFTInstance.sell(0, waitBlocks, minPrice, {from: accounts[1]})
        const blockAfterSell = await web3.eth.getBlock("latest")
        const artist_balance = new BN(await web3.eth.getBalance(accounts[0]))
        const balance1 = await web3.eth.getBalance(accounts[1])
        const balance2 = await web3.eth.getBalance(accounts[2])
        
        truffleAssert.eventEmitted(resultSell, 'AuctionStarted', (ev) => {
            simleAuctionAddress = ev.auctionContract
            return true
        }, "Sell Auction notification event has not been emited")

        let simleAuctionInstance = await SimpleAuction.at(simleAuctionAddress)
        const resultBid = await simleAuctionInstance.bid({value : bid, from : accounts[2]}) 
        const blockBeforeClose = await web3.eth.getBlock("latest")

        common.mineBlocks(waitBlocks - blockBeforeClose.number + blockAfterSell.number)

        let resultClose = await simleAuctionInstance.close({from: accounts[3]})
        const owner = await mandatoryRoyaltyNFTInstance.ownerOf(0, {from: accounts[3]})
        assert.equal(owner, accounts[2], "Owner should be account that baught")

        // Checking that Transfer event is emitted during the close transaction
        // It seems like a truffle bug - event is not listed in close transaction result 
        // but is catched by getPastEvents with correct transaction hash.
        let fromActual
        let toActual
        const fromExpected = accounts[1]
        const toExpected = accounts[2]
        TransferEvents = await mandatoryRoyaltyNFTInstance.getPastEvents( 'Transfer', { fromBlock: 0, toBlock: 'latest' } )
        let transferInCloseTx = false
        for (const tevent of TransferEvents) {
            if (tevent.transactionHash == resultClose.tx) {
                transferInCloseTx = true
                fromActual = tevent.args.from
                toActual = tevent.args.to
            }
        }
        assert(transferInCloseTx, "Transfer event has to be emitted during close transaction")
        assert.equal(fromActual, fromExpected, "Transfer event doesn't notify about a correct from address")
        assert.equal(toActual, toExpected, "Transfer event doesn't notify about a correct to address")

        artist_balance_diff  = (new BN(await web3.eth.getBalance(accounts[0]))).sub(artist_balance)

        artist_balance_diff_exp = bid * (commision/precision)
        acc_1_diff = (new BN(await web3.eth.getBalance(accounts[1]))).sub(new BN(balance1))
        acc_1_diff_exp = bid * (1 - commision/precision)  
        
        acc_2_diff = (new BN(await web3.eth.getBalance(accounts[2]))).sub(new BN(balance2))
        acc_2_diff_exp = - (new BN(bid)).add( await common.fundsTx(resultBid))
        assert.equal(artist_balance_diff, artist_balance_diff_exp, "Artist didn't recieve correct amount")
        assert.equal(acc_1_diff, acc_1_diff_exp, "Account 1, owner of the NFT, has an incorrect balance after sale even")
        assert.equal(acc_2_diff.toNumber(), acc_2_diff_exp, "Account 2, buyer of the NFT, has an incorrect balance after purchase even")
  })
})
