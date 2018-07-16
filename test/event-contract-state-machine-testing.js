var EventToken = artifacts.require("./EventToken.sol");
var EventContract = artifacts.require("./EventContract.sol");
var BigNumber = require('bignumber.js');
var id = Date.now();
var eventTime = Math.round((id + 3000)/1000);

contract('Event Protocol State machine testing', async (accounts) => {
  let instance;
  let eventToken;
  let scalar = BigNumber(10).pow(18);


  // create new smart contract instance before each test method
  beforeEach(async function(){
      eventToken = await EventToken.new(accounts[1], {from:accounts[0]});
      instance = await EventContract.new("SUTD Music Festivel",
      "Singapore",
      eventTime,
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
      let buyerActivationAmount = await instance.getBuyerActivationAmount();
      let sellerActivationAmount = await instance.getSellerActivationAmount();
      await eventToken.approve(accounts[1], sellerActivationAmount, {from : accounts[0]});
      await eventToken.transfer(accounts[1], sellerActivationAmount, {from: accounts[0]});

      await eventToken.approve(accounts[2], buyerActivationAmount, {from : accounts[0]});
      await eventToken.transfer(accounts[2], buyerActivationAmount, {from: accounts[0]});

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

  it("Test 2: Integration test for event activation, adding contributors, event reporting, acknowledgement of contributors and payout", async() =>{

      let buyer = await instance.getBuyer();
      let seller = await instance.getSeller();

      // add contributors
      await instance.addContributers(accounts[3], {from:accounts[2]});
      await instance.addContributers(accounts[4], {from:accounts[2]});
      await instance.addContributers(accounts[5], {from:accounts[2]});

      await instance.addContributers(accounts[6], {from:accounts[1]});
      await instance.addContributers(accounts[7], {from:accounts[1]});
      await instance.addContributers(accounts[8], {from:accounts[1]});


      // acknowledge contributors (buyer)
      await instance.acknowledgeContributors(accounts[3], 15*scalar , {from: accounts[2]});
      await instance.acknowledgeContributors(accounts[4], 10*scalar , {from: accounts[2]})
      await instance.acknowledgeContributors(accounts[5], 3*scalar , {from: accounts[2]})

      // acknowledge contributors (seller)
      await instance.acknowledgeContributors(accounts[6], 10*scalar , {from: accounts[1]});
      await instance.acknowledgeContributors(accounts[7], 20*scalar , {from: accounts[1]})
      await instance.acknowledgeContributors(accounts[8], 5*scalar , {from: accounts[1]})

      var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
      var prom = wait(2000)  // prom, is a promise
      var showdone = ()=> instance.checkEventCompletion();
      prom.then(showdone);

  })

})
