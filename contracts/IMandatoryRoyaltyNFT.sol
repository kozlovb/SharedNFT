pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @dev An interface of an NFT that can't be sold without paying a comission to previous owners
 */

interface IMandatoryRoyaltyNFT is IERC165 {

    /**
     * @dev Emitted when Auction for `tokenId` on the `address` ending at `endBlock` is started.
     */
    event AuctionStarted(uint256 indexed tokenId, address indexed auctionContract, uint indexed endBlock);

    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint indexed tokenId);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *      Owner has a right to organise an auction in order to sell a NFT.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Starts an auction in order to sell a given token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function sell(uint256 tokenId, uint256 delayBlock, uint minPrice) external;

    /**
     * @dev Transfer of ownership to a new adress.
     *      Should be called by the Auction contract from the sell method.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function transferTo(address payable to) payable external;
}
