// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import './IMandatoryRoyaltyNFT.sol';
import './SimpleAuction.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev Implementation of IMandatoryRoyaltyNFT, which is the interface of non-fungible token with obligatory royalties payements. It also implements
 * the IERC721Metadata Metadata extension of the regular IERC721 interface.
 */
contract MandatoryRoyaltyNFT is ERC165, IMandatoryRoyaltyNFT {
 
    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Auction parameter. Fixes min delay block for Auctions triggered by NFT owners
    uint private _minDelayBlock;

    uint public _commission;
    uint public constant _precision = 10000;

    // Mapping from token ID to owners
    mapping(uint=> address payable) private _owners;

    // Mapping auction addresses to tokens
    mapping(address => uint) private _auctionToTokens;

    mapping(uint => address) private _tokenToAuction;

    address payable public _artist;

    string _uriBase;

    /**
     * @dev Initializes the contract by setting `name`, `symbol`,  `commission`  - percentage calculated as commission in uints devided by the precision) 
     * and a 'minDelayBlock' to the token collection.
     */
    constructor(string memory name, string memory symbol, string memory uriBase, uint minDelayBlock, uint commission) {
        require(_commission < _precision);
        _name = name;
        _symbol = symbol;
        _uriBase = uriBase;
        _minDelayBlock = minDelayBlock;
        _artist = payable(msg.sender); 
        _commission = commission;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IMandatoryRoyaltyNFT).interfaceId ||
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
     * @dev Implements IERC721Metadata. Returns a NFT symbol.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns an owner of the token.
     */
    function ownerOf(uint tokenId) public view virtual returns (address) {
        require(tokenId >= 0);
        address owner = _owners[tokenId];
        require(owner != address(0), "MandatoryRoyaltyNFT: owner query for nonexistent token");
        return owner;
    }

    /**
     * @dev Returns a token URI.
     */
    function tokenURI(uint tokenId) public view virtual returns (string memory) {
       require(_exists(tokenId), "Mandatory royalty NFT metadata: URI query for nonexistent token");
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
     * Tokens start existing when they are minted (`mint`).
     */
    function _exists(uint tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0x0);
    }

    /**
     * @dev Mints `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     */
    function mint(address to, uint tokenId) public {
        require(_artist == msg.sender, "Only the artist can mint");
        require(!_exists(tokenId), "Token already minted");
        _owners[tokenId] = payable(to);
        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Creates an auction to sell `tokenId` and transfer it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     * - `delayBlock` cannot be less then a minimum set in the contract initially.
     *
     */
    function sell(uint tokenId, uint delayBlock, uint minPrice) public {

         require(msg.sender == _owners[tokenId]);
         require(_tokenToAuction[tokenId] == address(0x0));
         delayBlock = delayBlock > _minDelayBlock ? delayBlock : _minDelayBlock;
         address auction = address(new SimpleAuction(tokenId, address(this), delayBlock, minPrice));
         _tokenToAuction[tokenId] = auction;
         _auctionToTokens[auction] = tokenId;
         emit AuctionStarted(tokenId, auction, delayBlock + block.number);
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
        uint tokenId = _auctionToTokens[msg.sender];
        require(_tokenToAuction[tokenId] != address(0x0) && _tokenToAuction[tokenId] == msg.sender);
        require(to != address(0x0));  
        address payable previous_owner = _owners[tokenId];
        distribute(previous_owner, msg.value);
        
        _owners[tokenId] = to;
        _tokenToAuction[tokenId] = address(0x0);
        emit Transfer(previous_owner, to, tokenId);
    } 

    function distribute(address payable owner, uint amount) private {

        // Not checking for overflow as commision is limited by _precision 
        // and total amount of ether is under 10^9
        uint amount_commission = (amount * _commission)/_precision;

        _artist.transfer(amount_commission);
        owner.transfer(amount - amount_commission);
    }
}

