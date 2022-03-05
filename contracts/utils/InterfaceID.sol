pragma solidity ^0.8.0;

import '../IMandatoryRoyaltyNFT.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

// A test helper code, not to be deployed
library InterfaceID {

    function interfaceID(string calldata interfaceName) external view returns (bytes4) {

        if(keccak256(bytes(interfaceName))  == keccak256(bytes("IMandatoryRoyaltyNFT")))
        {
            return  type(IMandatoryRoyaltyNFT).interfaceId;
        } 
        if(keccak256(bytes(interfaceName))  == keccak256(bytes("IERC721Metadata")))
        {
            return  type(IERC721Metadata).interfaceId;
        } 
        return "";
    }

}
