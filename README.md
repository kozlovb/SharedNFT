# SharedNFT

## Overview

Lets consider a case where an NFT creator wishes to be able to get a commision from every sale of an NFT for a certain period of time.
This is cannot be enforced by the current standart ERC721.
Indeed, the "EIP-2981: NFT Royalty Standard" has a method that might be called or not by a market place. 
Currently main market places for jpeg/gif images are supporting these functions but this is different from having a mandatory commision sent to an artist or a group of. One cannot exclude the apperence of "pirate" market places ignoring this interface or over the counter sales. 
This might become a more important concern in the future when NFT's would represent other physical and digital assets.

This small project aims to adresse this issue by developing a new NFT like interface and providing an example of it's implemtation.

## Architecture choice

In this section different architecture approaches are considered.

### Using ERC721

It would be advantageous to implement a mandatory commision to an artist withtin the current standart. Therefore firstly the current standart ERC721 has been carefully considered. On the first glance the ovveride of safeTransferFrom(from, to, tokenId) or of transferFrom(from, to, tokenId) of ERC721 seems like a viable option. For example one can imagine an ovveridde where 'from' would be some DAO like smart contract adresse. Let's call it ArtistDAO and in the body of a transfer function instead of a transfer there would be a call to it:

safeTransferFrom(addresse from, addresse to, uint tokenId) {
    ...
    from.replace_owner(to);
    ....
}

the implementation of an ArtistDAO would allow to preserve the artists addresse. The commision might be sent through a function in ArtistDAO that reroutes part of every payment to the artist. This indeed may work for simple commisions like a certain fee per NFT transaction.
For example if an artist would like to recieve an X of funds each time an NFT changes hands then this would work. As an ArtistDAO contract may authorise replace_owner only after recievineg and sending to the artist required fixed amount. 
This fixed fee mecanism serves only a very limited amount of use cases. In case if artist would like to recieve a persentage of funds payed for a transfer a malicious market place may create a smart contract that calls a transfer without sending any funds prior to the "from" addresse i.e. the ArtistDAO. 

The are other optons like giving certain rights to the artist - to accept o reject a call of replace_owner.
But this in turn would open a complicated consensus issues like -  an artist blocking sales at will and becoming at the end a third negotiating party with veto right.

These examples show that transfer function which is done after money transfer itself will not work for a discussed problem.

### Different approach

The alternative to ERC721 approach is to make a transfer and recieve payment function as one. This is less flexible but would guarantee to an artist that his rights would be preserved. Furthermore, it is proposed that an owner may transfer ownership only throught initiating a public auction that can be monitored by any market place front end. This is done in order to avoid over the counter agreements described in the previou section. I.e. if an owner sets up a contract where he recieves funds on a different addresse before calling payable transfer with a close to zero amount. 

Having an auction would yield an another advantage is that anyone can create a market place front end that listens to such auctions thus reducing the monopoly of market places. So anyone can listen to the aucion start event and participate.

The auction contract initated by an owner will have a predefined auction time and a minimal accepted price. Where the former is with in the ranges predefined by an NFT contract deployed by the artist and the latter is defined by the owner.

### Various ownership models

Once there is a foundation that gurantees a commision transfered to an Artist adresse various ownership models can be considered. This can be achieved throught substituting an Artist contract by a smart contract that in turns redistributes commision betweean various owners or by directly 
modifying a fund distribution method called upon an end of the succesfull auction. One can also implement a contract with artist rights expiring at some point or with an increase or decrease of a commision per each sale.

### Prerequistes

# In order to tests locally 

Truffle v5.4.26 (core: 5.4.26)
Solidity - 0.8.10 (solc-js)
Node v14.17.3
Web3.js v1.5.3

### Files

# descriptions
###TODO 
