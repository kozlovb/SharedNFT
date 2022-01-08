// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import './SimpleAuction.sol';

//TODO removed once debugged
// TODO styling _v class members 
// local normal except constructor
// camel notation
/**
 * @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
 * the Metadata extension, but not including the Enumerable extension, which is available separately as
 * {ERC721Enumerable}.
 */
contract SharedNFT {
 

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
    event AuctionStarted(uint256 tokenId, address auctionContract);
    
    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor(string memory name, string memory symbol, uint minDelayBlock_) {
        _name = name;
        _symbol = symbol;
        _minDelayBlock = minDelayBlock_;
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        require(tokenId >= 0);
        address payable [] memory ownersArray = _owners[tokenId];
        address owner = ownersArray[ownersArray.length - 1];
       
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
//import back IERC721Metadata ?
    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
       return ""; 
       // string memory baseURI = _baseURI();
       // return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
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
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
     //TODO Impossible to know if having local reference is better then mapping
     // Gas cost need to be checked.
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
         address payable [] memory ownersArray = _owners[tokenId];
        return ownersArray.length > 0 && ownersArray[ownersArray.length-1] != address(0);
    }


//TODO whats the concept behind safe mint.
    /**
     * @dev Safely mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function mint(address payable to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function _mint(address payable to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _owners[tokenId].push(to);

        //emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
       // address owner = SharedNFT.ownerOf(tokenId);
       // delete _owners[tokenId];
        //emit Transfer(owner, address(0), tokenId);
    }

    function sell(uint256 tokenId) public {
         // require that it is the owner
         // price listener 
         // time has come seller can accept to sell 
         // do an interface of this stuff ?
         //The Psychedelic Furs
         if (_owners[tokenId].length > 0 ) {
            require(msg.sender == _owners[tokenId][_owners[tokenId].length - 1]);
         }
         //create auction 
         //Auction can be an interface
         //TODO Allow here to set more than min by the seller.
         address auction = address(new SimpleAuction(tokenId, address(this), _minDelayBlock));
         emit AuctionStarted(tokenId, auction);
         _auctionToTokens[auction] = tokenId;
    }


    function transfer_to(address payable to) payable public {
        //better to create variable or to call one more ?
        //check for gas 

        uint token_id = _auctionToTokens[msg.sender];
         _owners[token_id].push(to);
        require(token_id >= 0);
        require(to != address(0x0));
        distribute(_owners[token_id], msg.value);

       _owners[token_id].push(to);
        

        //can be an interface
    } 

    function distribute(address payable[] memory owners, uint amount) private {

        uint commision = amount/owners.length;

        for(uint i=0; i<owners.length; i++){
    
             owners[i].transfer(commision);
     
            //owners[i].transfer(commision);
        }
    }
}
