const SimpleAuction = artifacts.require("SimpleAuction")
const MockedMandatoryRoyaltyNFT = artifacts.require("MockedMandatoryRoyaltyNFT")
const truffleAssert = require('truffle-assertions')
const util = require('util')
const common = require('./common/common')
const BN = require('bn.js')
  
contract('SimpleAuction', (accounts) => {

    const tokenId = 0
    const delayBlocks = 15
    const minBid = BigInt(Math.pow(10, 15))
    let blockAfterAuctionConstr = 0
    let blockSimpleAuction = 0
    let simpleAuctionInstance

    beforeEach(async () => {
      mockedMandatoryRoyaltyNFTInstance = await MockedMandatoryRoyaltyNFT.new()
      blockSimpleAuction = (await web3.eth.getBlock("latest")).number
      simpleAuctionInstance = await SimpleAuction.new(tokenId, mockedMandatoryRoyaltyNFTInstance.address, delayBlocks, minBid)
      blockAfterAuctionConstr = await web3.eth.getBlock("latest")
    })

    it('Check tokenID', async () => {
      tokenIdActual = await simpleAuctionInstance._tokenId()
      assert.equal(tokenIdActual, tokenId, "Token id is wrong")
    })

    it('Check NFT contract', async () => {
      nftContractActual = await simpleAuctionInstance._nftContract()
      assert.equal(nftContractActual, mockedMandatoryRoyaltyNFTInstance.address, "NFT contract address is wrong")
    })

    it('Check delayBlocks', async () => {
      auctionEndBlockActual = await simpleAuctionInstance._auctionEndBlock()
      assert.equal(auctionEndBlockActual.toNumber(), blockSimpleAuction + delayBlocks+1, "Auction end block is wrong")
    })

    it('Check default winner', async () => { 
      const defaultWinnerExpected = 0x0
      const defaultWinnerActual = await simpleAuctionInstance._maxBid()
      assert.equal(defaultWinnerExpected, defaultWinnerActual, "Default winner should be 0 address")
    })  

    it('Check successful bid', async () => {
      const expectedWinner = accounts[0]
      const bidValueExpected  = 1000000
      await simpleAuctionInstance.bid({value : bidValueExpected, from : accounts[0]}) 
      const winnerActual = await simpleAuctionInstance._winner()
      assert.equal(winnerActual, expectedWinner, "Wrong winner")
      bidValueActual = await simpleAuctionInstance._maxBid()
      assert.equal(bidValueActual, bidValueExpected, "Offered value is wrong")
    })

    it('Check bids', async () => {
      const expectedWinner = accounts[1]
      const account0BidExp  = minBid + BigInt(100)
      const account1BidA = account0BidExp/BigInt(2) + BigInt(10)
      const account1BidB = account0BidExp/BigInt(2) + BigInt(10)
      const account1BidExp  = account1BidA + account1BidB

      await simpleAuctionInstance.bid({value : new BN(account1BidA), from : accounts[1]}) 
      await simpleAuctionInstance.bid({ value : new BN(account0BidExp), from : accounts[0]})
      await simpleAuctionInstance.bid({value : new BN(account1BidB), from : accounts[1]}) 

      const account0BidAct = await simpleAuctionInstance._bids(accounts[0])
      assert.equal(account0BidAct, account0BidExp, "Wrong bid for 0 account")
      const account1BidAct = await simpleAuctionInstance._bids(accounts[1])
      assert.equal(account1BidAct, account1BidExp, "Wrong bid for 1st account")
      const winnerActual = await simpleAuctionInstance._winner()
      assert.equal(winnerActual, expectedWinner, "Wrong winner")
      maxBidActual = await simpleAuctionInstance._maxBid()
      assert.equal(maxBidActual, account1BidExp, "Max bid value is wrong")
    })

    it('Check unsuccesfull close', async () => {
      await simpleAuctionInstance.bid({value : new BN(minBid + BigInt(100)), from : accounts[0]})
      const blockBeforeClose = await web3.eth.getBlock("latest")
      common.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number - 1)
      await truffleAssert.reverts(simpleAuctionInstance.close())
    })

    it('Check close with less than min allowed bid', async () => {
      await simpleAuctionInstance.bid({value : new BN(minBid/BigInt(2)), from : accounts[0]})
      const blockBeforeClose = await web3.eth.getBlock("latest")
      common.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number)
      
      const resultClose = await simpleAuctionInstance.close()

      assert(!(await common.findEventForTx(mockedMandatoryRoyaltyNFTInstance, 'Transfer', resultClose.tx)), "Transfer event should not be emitted during close transaction")
    })

    it('Check close', async () => {
      await simpleAuctionInstance.bid({value : new BN(minBid + BigInt(100)), from : accounts[1]})
      const blockBeforeClose = await web3.eth.getBlock("latest")
      common.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number)
      
      const resultClose = await simpleAuctionInstance.close()

      assert(await common.findEventForTx(mockedMandatoryRoyaltyNFTInstance, 'Transfer', resultClose.tx), "Transfer event has to be emitted during the 'close' transaction")
    })

    it('Check withdrawal', async () => {
      const balance1 = await web3.eth.getBalance(accounts[1])
      const balance2 = await web3.eth.getBalance(accounts[2])
      const bid1 = new BN(minBid + BigInt(100))
      const bid2 = new BN(minBid + BigInt(1000))

      ResultBid1 = await simpleAuctionInstance.bid({value : bid1, from : accounts[1]})
      ResultBid2 = await simpleAuctionInstance.bid({value : bid2, from : accounts[2]})

      const blockBeforeClose = await web3.eth.getBlock("latest")
      common.mineBlocks(delayBlocks - blockBeforeClose.number + blockAfterAuctionConstr.number)
      await debug(simpleAuctionInstance.close())
      ResultWithdraw1 = await simpleAuctionInstance.withdraw({from : accounts[1]})
      ResultWithdraw2 = await simpleAuctionInstance.withdraw({from : accounts[2]})

      const balanceDiff1 = (new BN(await web3.eth.getBalance(accounts[1]))).sub(new BN(balance1))
     
      const balanceDiff1Exp = -(await common.fundsTx(ResultBid1)).add( await common.fundsTx(ResultWithdraw1))
       
      const balanceDiff2 = (new BN(await web3.eth.getBalance(accounts[2]))).sub(new BN(balance2))
      const balanceDiff2Exp = -(bid2).add( await common.fundsTx(ResultBid2)).add( await common.fundsTx(ResultWithdraw2))
      assert.equal(balanceDiff1.toNumber() , balanceDiff1Exp, "Account1 balance is incorrect")
      assert.equal(balanceDiff2.toNumber(), balanceDiff2Exp, "Account2 balance is incorrect")
    })
})
