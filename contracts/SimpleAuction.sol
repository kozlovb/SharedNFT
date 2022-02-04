pragma solidity ^0.8.0;
import './ISharedNFT.sol';
contract SimpleAuction {

uint public _auctionEndBlock;
uint public _minPrice;
address payable public _winner;
uint256 public _maxBid;
uint public _tokenId;
address payable public _nftContract;
mapping (address => uint) public _bids;
bool closed = false;

constructor (uint tokenId_, address nftContract_, uint delayBlocks_, uint minPrice) {
    _tokenId = tokenId_;
    _nftContract = payable(nftContract_);
    _auctionEndBlock = block.number + delayBlocks_;
    _minPrice = minPrice;
}

function bid() public payable {
    require(block.number < _auctionEndBlock && !closed);
    uint new_bid = _bids[msg.sender] + msg.value;
    _bids[msg.sender] = new_bid;
    if (new_bid > _maxBid) {
        _maxBid = new_bid;
        _winner = payable(msg.sender);
    }
}

/// Withdraw a bid that was overbid.
function withdraw() public {
    require(block.number > _auctionEndBlock && closed);
    uint bidAmount = _bids[msg.sender];
    if (bidAmount > 0) {
        _bids[msg.sender] = 0;
        payable(msg.sender).transfer(bidAmount);
    }
}

function close() public {
    require(block.number > _auctionEndBlock && !closed);
    if (_winner != address(0) && _maxBid > _minPrice) {
       _bids[_winner] = 0;
       ISharedNFT(_nftContract).transferTo(_winner);
    }
    closed = true;
}

}

