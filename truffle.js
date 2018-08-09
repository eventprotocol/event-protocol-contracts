require('dotenv').config();
require('babel-register');
require('babel-polyfill');

var HDWalletProvider = require("truffle-hdwallet-provider");

// Store secrets separately
var secrets = require("./secrets");

// Rinkeby Settings
var rinkebyProvider = new HDWalletProvider(secrets.mnemonic, secrets.infuraURL);  

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      solc: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },

    rinkeby: {
      provider: rinkebyProvider, 
      network_id: 4,
    }
  }
};
