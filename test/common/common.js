const BN = require("bn.js");


//const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));

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
  return (new BN(resultTx.receipt.gasUsed)).mul(new BN(tx.gasPrice));;
}

module.exports = { mineBlocks,  fundsTx}

