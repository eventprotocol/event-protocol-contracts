# Event Protocol : Contracts
Includes ERC223 implementation of the utility token (Event Token) and smart contracts to utilize these tokens for the operations of this platform.

## Deploying Event Token on Rinkeby
# Install requirements
npm install truffle-hdwallet-provider

# Migration file to be edited as follows
var HDWalletProvider = require("truffle-hdwallet-provider");

// Store secrets separately
var secrets = require("./secrets");

// Rinkeby Settings
var rinkebyProvider = new HDWalletProvider(secrets.mnemonic, secrets.infuraURL);

# truffle.js file
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    rinkeby: {
      provider: rinkebyProvider,
      network_id: 4,
    }
  }
};


## Deployed Event Token details
event-token-alpha version address : 0x38dfdb8658f05113e5d2f97e2a79e253132c2e4c
controller_1 account : 0x0e35462535dae6fd521f0eea67dc4e9485c714dc
controller_2 account : 0x614770ac272333e6b8c356f8bafebd1443485be7
