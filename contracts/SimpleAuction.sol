pragma solidity ^0.8.0;
import './IMandatoryRoyaltyNFT.sol';

/**
 * @dev Implementation of an Auction Contract triggered by the Mandatory royalty NFT contract.
 */
contract SimpleAuction {

address payable public _nftContract;
address payable public _winner;
bool _closed = false;
uint public _auctionEndBlock;
uint public _minPrice;
uint public _maxBid;
uint public _tokenId;
mapping (address => uint) public _bids;

constructor (uint tokenId, address nftContract, uint delayBlocks, uint minPrice) {
    _tokenId = tokenId;
    _nftContract = payable(nftContract);
    _auctionEndBlock = block.number + delayBlocks;
    _minPrice = minPrice;
}

// Bid for the token. Compounds with the bid made previously.
function bid() public payable {
    require(block.number < _auctionEndBlock && !_closed);
    uint new_bid = _bids[msg.sender] + msg.value;
    _bids[msg.sender] = new_bid;
    if (new_bid > _maxBid) {
        _maxBid = new_bid;
        _winner = payable(msg.sender);
    }
}

/// Withdraw a bid that was overbid.
function withdraw() public {
    require(block.number > _auctionEndBlock && _closed);
    uint bidAmount = _bids[msg.sender];
    if (bidAmount > 0) {
        _bids[msg.sender] = 0;
        payable(msg.sender).transfer(bidAmount);
    }
}

//Closes the auction and transfers NFT to the winner.
function close() public {
    require(block.number > _auctionEndBlock && !_closed);
    if (_winner != address(0) && _maxBid > _minPrice) {
       _bids[_winner] = 0;
       IMandatoryRoyaltyNFT(_nftContract).transferTo{value: _maxBid}(_winner);
    }
    _closed = true;
}

}

