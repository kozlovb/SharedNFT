// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import '../ISharedNFT.sol';

/**
 * @dev Mocked shared NFT for testing.
 * the Metadata extension, but not including the Enumerable extension, which is available separately as
 * {ERC721Enumerable}.
 */
contract MockedSharedNFT is ISharedNFT {
 
    event AuctionStarted(uint256 tokenId, address auctionContract, uint endBlock);
    event Transfer(address from, address to, uint tokenId);

    //TODO external or public
    function ownerOf(uint256 tokenId) external view virtual returns (address) {
        return address(0x0);
    }

    function allOwners(uint256 tokenId) external view returns (address payable[] memory owners) {
      //  address payable [] memory result;
      //  result.push(0x0);
      //  result.push(0x0);
        //0x0  = payable(address [payable(address(0x0)), payable(address(0x0))]);
        //uint balance[3] = [1, 2, 3];
        //return payable(address [0x0, 0x0]);

        address payable[] memory result = new address payable [](2);
        result[0] = payable(address(0x0));
        result[0] = payable(address(0x0));
        return result;
    }

    function sell(uint256 tokenId, uint256 delayBlock) public {
    }

    function transferTo(address payable to) payable public {

        emit Transfer(address(0x0), address(0x0), 0);
    } 
}