pragma solidity ^0.8.0;
//TODO removed once debugged
//TODO check for the interfce of 

contract SimpleAuction {

uint public _auctionEndBlock;
address payable public _winner;
uint256 public _amount_offered;
uint public _tokenId;
address payable public _nftContract;

constructor (uint tokenId_, address nftContract_, uint delayBlocks_) {
    _tokenId = tokenId_;
    _nftContract = payable(nftContract_);
    _auctionEndBlock = block.number + delayBlocks_;
}

function bid() public payable {
    require(msg.value > _amount_offered);
    //return money to the previous winner ( TODO May be better to notify ? sp that he can add up?)
    if (_amount_offered > 0) {
        _winner.send(_amount_offered);
    }
    _winner = payable(msg.sender);
    _amount_offered = msg.value;
}

function close() public {

    require(block.number > _auctionEndBlock);

    if (_winner != address(0) && _amount_offered > 0) {
       
        _nftContract.call{value: _amount_offered}(abi.encodeWithSignature("transferTo(address)", _winner));
    }
    
}

}

