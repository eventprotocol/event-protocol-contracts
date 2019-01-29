const EventContract = artifacts.require("./EventContract.sol");

module.exports = (deployer, network, accounts) => {

    let deployerAddress = accounts[0];
    console.log(deployerAddress);

    let eventProtocolAddress = 0x1948072CD04b93F4a8BAFaaEf8B19166F03AF8d6;
    let eventTokenAddress = 0x7143a8faa78b56fbdfefe0cfba58016f21620bf6;

    console.log('Preparing for deployment of Event Contract Blue print...');

    if( network == "mainnet" ) {
        throw "Halt. Sanity check. Not ready for deployment to mainnet. Manually remove this throw and try again.";
    }

    else if (network == "rinkeby"){
        console.log("Rinkeby network found!.. Proceed with deployment")
    }

    console.log('deploying from:' + deployerAddress);
    console.log("Network is " + network);
    deployer.deploy(EventContract,
	eventProtocolAddress, eventTokenAddress, {from: deployerAddress});

};
