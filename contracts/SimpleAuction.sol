pragma solidity ^0.8.0;
//TODO removed once debugged


contract SimpleAuction {

uint public _chainStartBlock;
uint public _delayBlocks;
address payable public _winner;
uint256 public _amount_offered;
uint public _tokenId;
address payable _nftContract;

constructor (uint tokenId_, address nftContract_, uint delayBlock_) {
    _tokenId = tokenId_;
    _nftContract = payable(nftContract_);
    _chainStartBlock = block.number;
    _delayBlocks = delayBlock_;
}

function bid() public payable {
    require(block.number <= _chainStartBlock + _delayBlocks);
    require(msg.value > _amount_offered);
    //return money to the previous wnner ( TODO May be better to notify ? sp that he can add up?)
    if (_amount_offered > 0) {
        _winner.send(_amount_offered);
    }
    
    _winner = payable(msg.sender);
    _amount_offered = msg.value;

}

function close() public {

    require(block.number > _chainStartBlock + _delayBlocks);

    if (_winner != address(0) && _amount_offered > 0) {
       
        _nftContract.call{value: _amount_offered}(abi.encodeWithSignature("transfer_to(address)", _winner));
    }
    
}

}

