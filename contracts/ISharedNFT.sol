
pragma solidity ^0.8.0;

import "./IERC165.sol";

/**
 * @dev An interface of an NFT that couldn't be sold without paying a comission to previous owners
 */
interface ISharedNFT is IERC165 {

    /**
     * @dev Returns the owner of the `tokenId` token.
     *      Owner has a right to organise an aauction in order to sell a NFT.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */

    function ownerOf(uint256 tokenId) external view returns (address owner);
    /**
     * @dev Returns the array of NFT owners of the `tokenId` token.
     *      Those owners are getting a commision. 
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */

    function allOwners(uint256 tokenId) external view returns (address payable[] memory owners);
//todo external vs public
    /**
     * @dev Starts an auction in order to sell a given token.
     *      Those owners are getting a commision.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function sell(uint256 tokenId, uint256 delayBlock) external;

    /**
     * @dev Transfer of right to sell to a new adress.
     *      Should be called by the Auction contract from sell method.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function transferTo(address payable to) payable external;
}