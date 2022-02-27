// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import '../ISharedNFT.sol';

/**
 * @dev Mocked implementation of Shared NFT interface for testing purposes.
 */
contract MockedSharedNFT is ISharedNFT {
 
    //TODO external or public
    function ownerOf(uint256) external view virtual returns (address) {
        return address(0x0);
    }

    function sell(uint256 , uint256 , uint ) public {
    }

    function transferTo(address payable) payable public {

        emit Transfer(address(0x0), address(0x0), 0);
    } 

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165) returns (bool) {
        return true;
    }
}