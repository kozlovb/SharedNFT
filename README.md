# MandatoryRoyaltyNFT

## Overview

Let's consider a case where an NFT creator wishes to get a commission from every sale of an NFT for a certain period of time.
This cannot be enforced by the current standard ERC721.
Indeed, the "EIP-2981: NFT Royalty Standard" - a royalty extension of ERC721 has a method that might be called or not by a marketplace. 
Currently, main marketplaces are supporting these functions, but this is different from having a mandatory commission sent to an artist or a group of. One cannot exclude the appearance of "pirate" marketplaces ignoring this interface or over-the-counter sales. 

This project aims to adresse this issue by developing a new NFT interface and providing an example of its implemtation.

## Architecture choice

In this section different architecture approaches are considered.

### Using ERC721

It would be advantageous to implement a mandatory commission to an artist within the current standard. Therefore, firstly, the current standard ERC721 has been carefully considered. At first glance, the ovveride of safeTransferFrom(from, to, tokenId) or of transferFrom(from, to, tokenId) of ERC721 seems like a viable option. For example, one can imagine an override where 'from' would be some DAO like smart contract adresse. Let's call it ArtistDAO and in the body of a transfer function, instead of a transfer there would be a call to this constract:

safeTransferFrom(address from, address to, uint tokenId) {
    ...
    from.replace_owner(to);
    ....
}

the implementation of an ArtistDAO would allow preserving the artist's address. The commission might be sent through a function in ArtistDAO that reroutes part of every payment to the artist. This indeed may work for simple commissions, like a certain fee per NFT transaction.
For example, if an artist would like to receive an X of funds each time an NFT changes hands then this would work. As ArtistDAO contract may authorize replace_owner only after receiving and sending to the artist required fixed commission. 
This fixed fee mechanism serves only a very limited amount of use cases. In case if artist would like to receive a percentage of funds paid for a transfer, a malicious marketplace may create a smart contract that calls a transfer without sending any funds prior to calling the transfer function. 

There are other options like giving certain rights to the artist - to accept or reject a call of replace_owner.
But this in turn would open a complicated consensus issues - an artist blocking sales at will and becoming at the end a third negotiating party with the veto right.

### Different approach

The alternative to ERC721 approach is to make a transfer and receive payment function as one. This is less flexible, but would guarantee to an artist that his rights would be preserved. Furthermore, it is proposed that an owner may transfer ownership only through initiating a public auction that can be monitored by any marketplace front end. This is done in order to avoid over-the-counter agreements described in the previous section. I.e. if an owner sets up a contract where he receives funds on a different address before calling payable transfer with a close to zero amount. 

Having an auction would yield another advantage is that anyone can create a marketplace front end that listens to such auctions, thus reducing the monopoly of marketplaces. So anyone can listen to the auction start event and participate.

The auction contract initiated by an owner will have a predefined auction time and a minimal accepted price. Where the former is with in the ranges predefined by an NFT contract deployed by the artist and the latter is defined by the owner.

### Various ownership models

Once there is a foundation that guarantees a commission to an Artist, then various ownership models can be considered. This can be achieved through substituting an owner address by a smart contract or by calling various distribute funds functions upon an end of the successful auction. One can also implement a contract with artist rights expiring at some point, or with an increase or decrease of a commission per each sale.

### Prerequistes

# In order to run tests locally 

Truffle v5.4.26 
Solidity - 0.8.10 (solc-js)
Web3.js v1.5.3
