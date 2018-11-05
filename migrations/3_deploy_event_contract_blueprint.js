const EventContract = artifacts.require("./EventContract.sol");

module.exports = (deployer, network, accounts) => {

    let deployerAddress = accounts[0];
    console.log(deployerAddress);

    let eventName = "Kevin Park Conference";
    let eventLocation = "Orchard, SG";
    let eventDate = 1542295699;
    let buyer = 0x24eeac4f88412dc27f4b802ea8eb8b4725cf3af8;
    let allowedPostponements = 2;
    let buyerEscrow = 5;
    let sellerEscrow = 5;
    let sellerAdvanceFee = 50;
    let sellerCancellationPenalty = 25;
    let buyerContributionPoolAmount = 20;
    let sellerContributionPoolAmount = 20;
    let eventPaymentAmount = 800;
    let eventProtocolAddress = accounts[0];
    let eventTokenAddress = 0x38dFdB8658f05113E5d2F97E2A79e253132c2e4C;

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
        eventName, eventLocation, eventDate, buyer, allowedPostponements, buyerEscrow, sellerEscrow, sellerAdvanceFee,
        sellerCancellationPenalty, buyerContributionPoolAmount, sellerContributionPoolAmount,
        eventPaymentAmount, eventProtocolAddress, eventTokenAddress, {from: deployerAddress});

};
