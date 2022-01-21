// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import './ISharedNFT.sol';
import './SimpleAuction.sol';
import "./ERC165.sol";
import "./openzeppelin/Strings.sol";

//TODO removed once debugged
// TODO styling _v class members 
// local normal except constructor
// camel notation
// Create an interface ? 
//TODO - sort out where real NFT is stored.
//TODO think of interface to metadata 
/**
 * @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
 * the Metadata extension, but not including the Enumerable extension, which is available separately as
 * {ERC721Enumerable}.
 */
contract SharedNFT is ERC165 {
 
    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    uint private _minDelayBlock;

    // Mapping from token ID to owner addresses
    mapping(uint256 => address payable[]) private _owners;
    mapping(address => uint256) private _auctionToTokens;

    // Mapping owner address to token count
    //mapping(address => uint256) private _balances;
    event AuctionStarted(uint256 tokenId, address auctionContract, uint endBlock);
    event Transfer(address from, address to, uint tokenId);
    
    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor(string memory name, string memory symbol, uint minDelayBlock_) {
        _name = name;
        _symbol = symbol;
        _minDelayBlock = minDelayBlock_;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165) returns (bool) {
        return
            interfaceId == type(ISharedNFT).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Inspired by IERC721Metadata. Returns NFT name.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Inspired by IERC721Metadata. Returns an NFT symbol.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns an owner that can initiate a sell auction.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        require(tokenId >= 0);
        
        address payable [] storage ownersArray = _owners[tokenId];
        address owner = ownersArray[ownersArray.length - 1];
       
        require(owner != address(0), "SharedNFT: owner query for nonexistent token");
        return owner;
    }

    /**
     * @dev Returns a set of owners getting commision from every sell.
     */
    function allOwners(uint256 tokenId) external view returns (address payable[] memory owners) {
        require(tokenId >= 0);
        address payable [] memory result  = _owners[tokenId];
        return result;
    }

    /**
     * @dev Inspired by IERC721Metadata.
     */
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
       require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
       string memory baseURI = _baseURI();
       return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, Strings.toString(tokenId))) : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens start existing when they are minted (`_mint`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId].length > 0;
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function mint(address payable to, uint256 tokenId) public {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _owners[tokenId].push(to);
        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Creates an auction to sell `tokenId` and transfer it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     * - `delayBlock` cannot be less then a minimum set in a contract initially.
     *
     */
     //TOOD min price ?
    function sell(uint256 tokenId, uint256 delayBlock) public {

         if (_owners[tokenId].length > 0 ) {
            require(msg.sender == _owners[tokenId][_owners[tokenId].length - 1]);
         }

         delayBlock = delayBlock > _minDelayBlock ? delayBlock : _minDelayBlock;
         address auction = address(new SimpleAuction(tokenId, address(this), delayBlock));
         emit AuctionStarted(tokenId, auction, delayBlock + block.number);

         _auctionToTokens[auction] = tokenId;
    }

    /**
     * @dev Transfers `tokenId` to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     * - `to` has to be a valid address
     *
     * Can be called only by an auction contract registered previously.
     *
     * Emits a {Transfer} event.
     */
    function transferTo(address payable to) payable public {
        uint token_id = _auctionToTokens[msg.sender];
        require(token_id >= 0);
        require(to != address(0x0));
        distribute(_owners[token_id], msg.value);
        address payable [] storage ownersArray = _owners[token_id];
        ownersArray.push(to);
        emit Transfer(ownersArray[ownersArray.length - 2], ownersArray[ownersArray.length - 1], token_id);
    } 

    function distribute(address payable[] memory owners, uint amount) private {

        uint commision = amount/owners.length;

        for(uint i=0; i<owners.length; i++){
    
             owners[i].transfer(commision);
        }
    }
}
