const BN = require("bn.js");

const mine = async () => await web3.currentProvider.send({
  jsonrpc: '2.0',
  method: 'evm_mine',
  id: new Date().getTime()
}, function (error) {})

function mineBlocks(numberOfBlocks) {
  if (numberOfBlocks <= 0 )
      return;
  for (let i = 0; i < numberOfBlocks; i++) {
    mine();
  }
}

async function fundsTx(resultTx) {
  const tx = await web3.eth.getTransaction(resultTx.tx);
  return (new BN(resultTx.receipt.gasUsed)).mul(new BN(tx.gasPrice));
}

async function findEventForTx(instance, eventName, transaction) {
  TransferEvents = await instance.getPastEvents( eventName, { fromBlock: 0, toBlock: 'latest'} );
  let eventInTx = false;
  for (const tevent of TransferEvents) {
    if (tevent.transactionHash == transaction) {
      eventInTx = true;
    }
  };
  return eventInTx;
}



module.exports = {mineBlocks, fundsTx, findEventForTx}

