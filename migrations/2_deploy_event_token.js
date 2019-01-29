const GreatestShow = artifacts.require("./EventToken.sol");

module.exports = (deployer, network, accounts) => {
    console.log(accounts[0])
    let deployAddress = accounts[0]; // eth address : Keshik
    let controller2Address = 0x614770ac272333e6b8c356f8bafebd1443485be7; // eth address : Joshia

    console.log('Preparing for deployment of Event Token...');

    if( network == "mainnet" ) {
        throw "Halt. Sanity check. Not ready for deployment to mainnet. Manually remove this throw and try again.";
    }

    else if (network == "rinkeby"){
        //console.log("Rinkeby network found!.. Proceed with deployment")
        //console.log("Already deployed");
        //throw "Already deployed at 0x38dFdB8658f05113E5d2F97E2A79e253132c2e4C"
    }

    console.log('deploying from:' + deployAddress);
    console.log("Network is " + network);
    deployer.deploy(GreatestShow,
        controller2Address, {from: deployAddress});

};
