const HDWalletProvider = require('@truffle/hdwallet-provider');
const privateKey = "3543ebb704d4c2ddd4fae9663ecaea8213972758a01fecad9c217e335e4a0bc8"

module.exports = {
  networks: {
    edgechain: {
      provider: () => new HDWalletProvider(privateKey, "http://localhost:10002/"),
      network_id: "*",
      chain_id: 100,
    }
  },
  mocha: {
    // timeout: 100000
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.13",      // Fetch exact version from solc-bin
    }
  }
};
