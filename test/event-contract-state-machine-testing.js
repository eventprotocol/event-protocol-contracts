var EventToken = artifacts.require("./EventToken.sol");
var EventContract = artifacts.require("./EventContract.sol");
var BigNumber = require('bignumber.js');

contract('Event Protocol State machine testing', async (accounts) => {
  let instance;
  let eventToken;
  let scalar = BigNumber(10).pow(18);

  // create new smart contract instance before each test method
  beforeEach(async function(){
      eventToken = await EventToken.new(accounts[1], {from:accounts[0]});
      instance = await EventContract.new("SUTD Music Festivel",
      "Singapore",
      1543687200,
      accounts[2],
      2,
      30*Math.pow(10,18),
      50*Math.pow(10,18),
      200*Math.pow(10,18),
      250*Math.pow(10,18),
      30*Math.pow(10,18),
      35*Math.pow(10,18),
      1000*Math.pow(10,18),
      accounts[0],
      eventToken.address, {from:accounts[1]});

      //Deposit sufficient funds to accounts[1] and accounts[2];
      let _amount = 1000000*Math.pow(10,18);
      await eventToken.approve(accounts[1], _amount, {from : accounts[0]});
      await eventToken.transfer(accounts[1], _amount, {from: accounts[0]});

      await eventToken.approve(accounts[2], _amount, {from : accounts[0]});
      await eventToken.transfer(accounts[2], _amount, {from: accounts[0]});


  })

  beforeEach(async function(){
    //activate event contract
    let buyerActivationAmount = await instance.getBuyerActivationAmount();
    let sellerActivationAmount = await instance.getSellerActivationAmount();
    let buyer = await instance.getBuyer();
    let seller = await instance.getSeller();

    await eventToken.approve(instance.address, buyerActivationAmount, {from: accounts[2]});
    await eventToken.approve(instance.address, sellerActivationAmount, {from: accounts[1]});

    await eventToken.transferToContract(instance.address, buyerActivationAmount, ["0x12"], {from: accounts[2]});
    await eventToken.transferToContract(instance.address, sellerActivationAmount, ["0x12"], {from:accounts[1]});
  })


  it("Test 1: Expected successful addition of contributors by both buyer and seller followed by state check", async() =>{
      let buyer = await instance.getBuyer();
      let seller = await instance.getSeller();

      await instance.addContributers(accounts[3], {from:accounts[2]});
      await instance.addContributers(accounts[4], {from:accounts[2]});
      await instance.addContributers(accounts[5], {from:accounts[2]});

      await instance.addContributers(accounts[6], {from:accounts[1]});
      await instance.addContributers(accounts[7], {from:accounts[1]});
      await instance.addContributers(accounts[8], {from:accounts[1]});
      await instance.addContributers(accounts[9], {from:accounts[1]});

      let contributorPoolSize_buyer = BigNumber(await instance.getContributorPoolSize(buyer));
      let contributorPoolSize_seller = BigNumber(await instance.getContributorPoolSize(seller));

      let _bool1 = contributorPoolSize_buyer.eq(3);
      let _bool2 = contributorPoolSize_seller.eq(4);
      assert.strictEqual(_bool1, true, "The buyer contribution pool size does not match");
      assert.strictEqual(_bool2, true, "The seller contribution pool size does not match");
  })

})
