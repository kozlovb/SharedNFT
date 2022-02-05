pragma solidity ^0.8.0;

import '../ISharedNFT.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";


library InterfaceID {

    function interfaceID(string calldata interfaceName) external view returns (bytes4) {

        if(keccak256(bytes(interfaceName))  == keccak256(bytes("ISharedNFT")))
        {
            return  type(ISharedNFT).interfaceId;
        } 
        if(keccak256(bytes(interfaceName))  == keccak256(bytes("IERC721Metadata")))
        {
            return  type(IERC721Metadata).interfaceId;
        } 
        return "";
    }

}
