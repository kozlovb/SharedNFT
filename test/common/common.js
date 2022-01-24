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

module.exports = { mineBlocks }
