var EventToken = artifacts.require("./EventToken.sol");
var EventContract = artifacts.require("./EventContract.sol");
var BigNumber = require('bignumber.js');

contract('Event Protocol State machine testing', async (accounts) => {
  let instance;
  let eventToken;
  let scalar = BigNumber(10).pow(18);
  let id;
  let eventTime;

  function pause(milliseconds) {
    var dt = new Date();
    while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
  }


  // create new smart contract instance before each test method
  beforeEach(async function(){
      eventToken = await EventToken.new(accounts[1], {from:accounts[0]});
      id = Date.now();
      eventTime = Math.round((id + 2000)/1000);
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
      accounts[9],
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
      let state1, state2;

      // add contributors (by buyer)
      await instance.addContributers(accounts[3], {from:accounts[2]});
      await instance.addContributers(accounts[4], {from:accounts[2]});
      await instance.addContributers(accounts[5], {from:accounts[2]});

      // add contributors (by seller)
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

      // Once the event date has passed, change event state from ACTIVE => REPORTING
      state1 = await instance.getEventState();
      pause(3000);

      await instance.checkEventCompletion();
      state2 = await instance.getEventState();
      assert.strictEqual(state1.toNumber(), 1, "The contract states do not match (Expected ACTIVE)");
      assert.strictEqual(state2.toNumber(), 4, "The contract states do not match (Expected REPORTING)");

      // Resolve event
      await instance.submitResolveRequest(1, {from:accounts[1]});
      await instance.completeResolve(1, {from:accounts[2]});

      // Get balances of all the accounts
      let balance0 = await eventToken.balanceOf(accounts[9]); //50 is expected
      let balance1 = await eventToken.balanceOf(accounts[1]); //1250 is expected
      let balance2 = await eventToken.balanceOf(accounts[2]); //32 is expected

      let balance3 = await eventToken.balanceOf(accounts[3]); //15 is expected
      let balance4 = await eventToken.balanceOf(accounts[4]); //10 is expected
      let balance5 = await eventToken.balanceOf(accounts[5]); //3 is expected

      let balance6 = await eventToken.balanceOf(accounts[6]); //10 is expected
      let balance7 = await eventToken.balanceOf(accounts[7]); //20 is expected
      let balance8 = await eventToken.balanceOf(accounts[8]); //5 is expected

      // Compare the values with the expected values
      let _bool0 = balance0.eq(BigNumber(50).times(scalar));
      let _bool1 = balance1.eq(BigNumber(1250).times(scalar));
      let _bool2 = balance2.eq(BigNumber(32).times(scalar));

      let _bool3 = balance3.eq(BigNumber(15).times(scalar));
      let _bool4 = balance4.eq(BigNumber(10).times(scalar));
      let _bool5 = balance5.eq(BigNumber(3).times(scalar));

      let _bool6 = balance6.eq(BigNumber(10).times(scalar));
      let _bool7 = balance7.eq(BigNumber(20).times(scalar));
      let _bool8 = balance8.eq(BigNumber(5).times(scalar));

      // Asserts
      assert.strictEqual(_bool0, true, "Event protocol account balances do not match");
      assert.strictEqual(_bool1, true, "Seller account balances do not match");
      assert.strictEqual(_bool2, true, "Buyer account balances do not match");

      assert.strictEqual(_bool3, true, "Balance of accounts[3] does not match");
      assert.strictEqual(_bool4, true, "Balance of accounts[4] does not match");
      assert.strictEqual(_bool5, true, "Balance of accounts[5] does not match");

      assert.strictEqual(_bool6, true, "Balance of accounts[6] does not match");
      assert.strictEqual(_bool7, true, "Balance of accounts[7] does not match");
      assert.strictEqual(_bool8, true, "Balance of accounts[8] does not match");
  })

  it("Test 3: Integration test for adding contributors, acknowledging contributors and cancellation of event by buyer", async() =>{

      let buyer = await instance.getBuyer();
      let seller = await instance.getSeller();
      let state1, state2, state3;

      // add contributors (buyer)
      await instance.addContributers(accounts[3], {from:accounts[2]});
      await instance.addContributers(accounts[4], {from:accounts[2]});
      await instance.addContributers(accounts[5], {from:accounts[2]});

      // add contributors (seller)
      await instance.addContributers(accounts[6], {from:accounts[1]});
      await instance.addContributers(accounts[7], {from:accounts[1]});
      await instance.addContributers(accounts[8], {from:accounts[1]});

      // acknowledge contributors (buyer)
      await instance.acknowledgeContributors(accounts[3], 10*scalar , {from: accounts[2]});
      await instance.acknowledgeContributors(accounts[4], 12*scalar , {from: accounts[2]})
      await instance.acknowledgeContributors(accounts[5], 5*scalar , {from: accounts[2]})

      // acknowledge contributors (seller)
      await instance.acknowledgeContributors(accounts[6], 7*scalar , {from: accounts[1]});
      await instance.acknowledgeContributors(accounts[7], 15*scalar , {from: accounts[1]})
      await instance.acknowledgeContributors(accounts[8], 3*scalar , {from: accounts[1]})

      // Once the event date has passed, change event state from ACTIVE => REPORTING
      state1 = await instance.getEventState();

      // Submit Cancellation request
      await instance.submitResolveRequest(2, {from:accounts[2]});
      state2 = await instance.getEventState();

      // Acknowledge Cancellation request
      await instance.acknowledgeCancelRequest({from:accounts[1]});
      state3 = await instance.getEventState();

      assert.strictEqual(state1.toNumber(), 1, "The contract states do not match (Expected ACTIVE)");
      assert.strictEqual(state2.toNumber(), 3, "The contract states do not match (Expected CANCELLATION)");
      assert.strictEqual(state3.toNumber(), 6, "The contract states do not match (Expected SETTLED)");

      // Check balances
      let balance0 = await eventToken.balanceOf(accounts[9]); //50 is expected
      let balance1 = await eventToken.balanceOf(accounts[1]); //1000 is expected
      let balance2 = await eventToken.balanceOf(accounts[2]); //32 is expected

      let balance3 = await eventToken.balanceOf(accounts[3]); //10 is expected
      let balance4 = await eventToken.balanceOf(accounts[4]); //12 is expected
      let balance5 = await eventToken.balanceOf(accounts[5]); //5 is expected

      let balance6 = await eventToken.balanceOf(accounts[6]); //7 is expected
      let balance7 = await eventToken.balanceOf(accounts[7]); //15 is expected
      let balance8 = await eventToken.balanceOf(accounts[8]); //3 is expected

      let _bool0 = balance0.eq(BigNumber(50).times(scalar));
      let _bool1 = balance1.eq(BigNumber(510).times(scalar));
      let _bool2 = balance2.eq(BigNumber(783).times(scalar));

      let _bool3 = balance3.eq(BigNumber(10).times(scalar));
      let _bool4 = balance4.eq(BigNumber(12).times(scalar));
      let _bool5 = balance5.eq(BigNumber(5).times(scalar));

      let _bool6 = balance6.eq(BigNumber(7).times(scalar));
      let _bool7 = balance7.eq(BigNumber(15).times(scalar));
      let _bool8 = balance8.eq(BigNumber(3).times(scalar));

      assert.strictEqual(_bool0, true, "Event protocol account balances do not match");
      assert.strictEqual(_bool1, true, "Seller account balances do not match");
      assert.strictEqual(_bool2, true, "Buyer account balances do not match");

      assert.strictEqual(_bool3, true, "Balance of accounts[3] does not match");
      assert.strictEqual(_bool4, true, "Balance of accounts[4] does not match");
      assert.strictEqual(_bool5, true, "Balance of accounts[5] does not match");

      assert.strictEqual(_bool6, true, "Balance of accounts[6] does not match");
      assert.strictEqual(_bool7, true, "Balance of accounts[7] does not match");
      assert.strictEqual(_bool8, true, "Balance of accounts[8] does not match");

  })

  it("Test 4: Integration test for adding contributors, acknowledging contributors and cancellation of event by seller", async() =>{
      let buyer = await instance.getBuyer();
      let seller = await instance.getSeller();
      let state1, state2, state3;

      // add contributors (buyer)
      await instance.addContributers(accounts[3], {from:accounts[2]});
      await instance.addContributers(accounts[4], {from:accounts[2]});
      await instance.addContributers(accounts[5], {from:accounts[2]});

      // add contributors (seller)
      await instance.addContributers(accounts[6], {from:accounts[1]});
      await instance.addContributers(accounts[7], {from:accounts[1]});
      await instance.addContributers(accounts[8], {from:accounts[1]});

      // acknowledge contributors (buyer)
      await instance.acknowledgeContributors(accounts[3], 10*scalar , {from: accounts[2]});
      await instance.acknowledgeContributors(accounts[4], 12*scalar , {from: accounts[2]})
      await instance.acknowledgeContributors(accounts[5], 5*scalar , {from: accounts[2]})

      // acknowledge contributors (seller)
      await instance.acknowledgeContributors(accounts[6], 7*scalar , {from: accounts[1]});
      await instance.acknowledgeContributors(accounts[7], 15*scalar , {from: accounts[1]})
      await instance.acknowledgeContributors(accounts[8], 3*scalar , {from: accounts[1]})

      // Once the event date has passed, change event state from ACTIVE => REPORTING
      state1 = await instance.getEventState();

      // Submit Cancellation request
      await instance.submitResolveRequest(2, {from:accounts[1]});
      state2 = await instance.getEventState();

      // Acknowledge Cancellation request
      await instance.acknowledgeCancelRequest({from:accounts[2]});
      state3 = await instance.getEventState();

      assert.strictEqual(state1.toNumber(), 1, "The contract states do not match (Expected ACTIVE)");
      assert.strictEqual(state2.toNumber(), 3, "The contract states do not match (Expected CANCELLATION)");
      assert.strictEqual(state3.toNumber(), 6, "The contract states do not match (Expected SETTLED)");

  })

})
