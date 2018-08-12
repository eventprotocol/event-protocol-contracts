const GreatestShow = artifacts.require("./EventToken.sol");

module.exports = (deployer, network, accounts) => {

    let deployAddress = accounts[0]; // by convention
    let controller2Address = accounts[1];

    console.log('Preparing for deployment of Event Token...');

    if( network == "mainnet" ) {
        throw "Halt. Sanity check. Not ready for deployment to mainnet. Manually remove this throw and try again.";
    }

    console.log('deploying from:' + deployAddress);
    console.log("Network is " + network);
    deployer.deploy(GreatestShow,
        controller2Address, {from: deployAddress});

};
