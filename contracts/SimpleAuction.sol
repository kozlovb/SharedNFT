pragma solidity ^0.8.0;
//TODO removed once debugged
//TODO check for the interfce of 
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
    require(!closed);
    _bids[msg.sender] += msg.value;
  
    // Check if opt for gas
    if (_bids[msg.sender] > _maxBid) {
        _maxBid = _bids[msg.sender];
        _winner = payable(msg.sender);
    }
}

/// Withdraw a bid that was overbid.
function withdraw() public {
    require(block.number > _auctionEndBlock && closed);
    uint bidAmount = _bids[msg.sender];
    if (bidAmount > 0) {
        // It is important to set this to zero because the recipient
        // can call this function again as part of the receiving call
        // before `send` returns.
        _bids[msg.sender] = 0;

//can this realy fail   !!!??
//how to substract gas used for withdrawal
//todo can convertion fail
        if (!payable(msg.sender).send(bidAmount)) {
            _bids[msg.sender] = bidAmount;
        }
    }
  
}

function close() public {
    require(block.number > _auctionEndBlock && !closed);
    if (_winner != address(0) && _maxBid > _minPrice) {
        //if reverts all reverts unlike  
       //_nftContract.call{value: _maxBid}(abi.encodeWithSignature("transferTo(address)", _winner));
       _bids[_winner] = 0;
       ISharedNFT(_nftContract).transferTo(_winner);
    }
    closed = true;
}

}

