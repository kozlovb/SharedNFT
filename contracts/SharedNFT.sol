// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import './ISharedNFT.sol';
import './SimpleAuction.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";


// local normal except constructor
// camel notation

//TODO - sort out where real NFT is stored.
//TODO - make an md . 

/**
 * @dev Implementation of ISharedNFT, which is shared non-fungible token interface. It also implements
 * the IERC721Metadata Metadata extension of a classic IERC721 interface.
 */
contract SharedNFT is ERC165, ISharedNFT {
 
    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Auction parameter. Fixes min delay block for Auctions triggered by NFT owners
    uint private _minDelayBlock;
//TODO uint or not ? 1000000
    uint public _commision;
    uint public precision = 10000;

    // Mapping from token ID to owners
    mapping(uint256 => address payable) private _owners;

    // Mapping auction addresses to tokens
    mapping(address => uint256) private _auctionToTokens;
//todo artist shoulb be able to sell his rights
    address payable public _artist;

    string _uriBase;

    /**
     * @dev Initializes the contract by setting a `name`, a `symbol` and a 'minDelayBlock_' to the token collection.
     */
    constructor(string memory name_, string memory symbol_, string memory uriBase_, uint minDelayBlock_, uint commision_) {
        require(_commision < precision);
        _name = name_;
        _symbol = symbol_;
        _uriBase = uriBase_;
        _minDelayBlock = minDelayBlock_;
        _artist = payable(msg.sender); 
        _commision = commision_;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(ISharedNFT).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Implements IERC721Metadata. Returns NFT name.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Implements IERC721Metadata. Returns an NFT symbol.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns an owner that can initiate a sale auction.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        require(tokenId >= 0);
        address owner = _owners[tokenId];
        require(owner != address(0), "SharedNFT: owner query for nonexistent token");
        return owner;
    }

    /**
     * @dev Returns a token URI.
     */
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
       require(_exists(tokenId), "Shared NFT metadata: URI query for nonexistent token");
       string memory baseURI = _baseURI();
       return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, Strings.toString(tokenId))) : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return _uriBase;
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens start existing when they are minted (`_mint`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0x0);
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
     //TODO mint with 
    function mint(address payable to, uint256 tokenId) public {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    //TODO uint or uint256
    /**
     * @dev Creates an auction to sell `tokenId` and transfer it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     * - `delayBlock` cannot be less then a minimum set in a contract initially.
     *
     */
    function sell(uint256 tokenId, uint256 delayBlock, uint minPrice) public {

        //TODO check also for non zero
         require(msg.sender == _owners[tokenId]);
         

         delayBlock = delayBlock > _minDelayBlock ? delayBlock : _minDelayBlock;
         address auction = address(new SimpleAuction(tokenId, address(this), delayBlock, minPrice));
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
        address payable previous_owner = _owners[token_id];
        distribute(previous_owner, msg.value);
        
        _owners[token_id] = to;
        emit Transfer(previous_owner, to, token_id);
    } 

    function distribute(address payable owner, uint amount) private {

        //Not checking for overflow as commision is limited by precision and total amount of ether is under 
        // 10^9
        uint amount_commision = (amount * _commision)/precision;

        _artist.transfer(amount_commision);
        owner.transfer(amount - amount_commision);
    }
}

