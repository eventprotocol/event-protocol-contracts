var EventToken = artifacts.require("./EventToken.sol");
var EventContract = artifacts.require("./EventContract.sol");
var BigNumber = require('bignumber.js');

contract('Event Protocol Unit testing', async (accounts) => {
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



  it("Expected Event Name: SUTD Music Festivel", async() =>{
      return instance.getEventName.call().then(function(name){
        assert.strictEqual(name, "SUTD Music Festivel", "The event name does not match");
      })
  })

  it("Expected Event Location: Singapore", async() =>{
      return instance.getEventLocation.call().then(function(name){
        assert.strictEqual(name, "Singapore", "The event location does not match");
      })
  })

  it("Expected Buyer Address: account[3]", async() =>{
      return instance.getBuyer.call().then(function(buyer){
        assert.strictEqual(buyer, accounts[2], "The event buyer does not match");
      })
  })

  it("Expected Seller Address: account[1]", async() =>{
      return instance.getSeller.call().then(function(seller){
        assert.strictEqual(seller, accounts[1], "The event buyer does not match");
      })
  })

  it("Expected Token Address", async() =>{
      return instance.getTokenAddress.call().then(function(tokenAddr){
        assert.strictEqual(tokenAddr, eventToken.address, "The token address does not match");
      })
  })

  it("Expected buyer escrow amounts: 30", async() =>{
      let buyer = await instance.getBuyer();
      return instance.getEscrowAmounts.call(buyer).then(function(val){
        let _bool = val.eq(BigNumber(30).times(scalar));
        assert.strictEqual(_bool, true, "The buyer escrow does not match");
      })
  })

  it("Expected seller escrow amounts: 50", async() =>{
      let seller = await instance.getSeller();
      return instance.getEscrowAmounts.call(seller).then(function(val){
        let _bool = val.eq(BigNumber(50).times(scalar));
        assert.strictEqual(_bool, true, "The buyer escrow does not match");
      })
  })

  it("Expected event payment amount: 1000", async() =>{
      return instance.getEventPaymentCharges.call().then(function(val){
        let _bool = val.eq(BigNumber(1000).times(scalar));
        assert.strictEqual(_bool, true, "The event payment value does not match");
      })
  })

  it("Expected event protocol charges amount: 50", async() =>{
      let eventPayment = await instance.getEventPaymentCharges();
      let protocolCharges = (eventPayment.times(5)).div(100);
      return instance.getEventProtocolCharges.call().then(function(val){
        let _bool = val.eq(protocolCharges);
        assert.strictEqual(_bool, true, "The event protocol charges do not match");
      })
  })

  it("Expected Seller Payout: 950", async() => {
      let eventPayment = await instance.getEventPaymentCharges();
      let protocolCharges = await instance.getEventProtocolCharges();
      let sellerPayout = eventPayment.minus(protocolCharges);
      let _bool = sellerPayout.eq(BigNumber(950).times(scalar));
      assert.strictEqual(_bool, true, "Seller payment amount does not match");
  })

  it("Expected contribution pool amount of buyer: 30", async() => {
      let buyer = await instance.getBuyer();
      let val = await instance.getContributionPoolAmounts(buyer)

      let _bool = val.eq(BigNumber(30).times(scalar));
      assert.strictEqual(_bool, true,  "The contribution pool amount of buyer does not match");
  })

  it("Expected contribution pool amount of seller: 35", async() =>{
      let seller = await instance.getSeller();
      let val = await instance.getContributionPoolAmounts(seller)
      let _bool = val.eq(BigNumber(35).times(scalar));
      assert.strictEqual(_bool, true, "The contribution pool amount of buyer does not match");
  })

  it("Expected buyer cancellation fee: 250", async() => {
      let val = await instance.getBuyerCancellationFee()
      let _bool = val.eq(BigNumber(250).times(scalar));
      assert.strictEqual(_bool, true, "The buyer cancellation fee does not match");
  })


  it("Expected seller advance fee: 250", async() => {
      let val = await instance.getSellerAdvanceFee();
      let _bool = val.eq(BigNumber(200).times(scalar));
      assert.strictEqual(_bool, true, "The seller advance fee does not match");
  })

  it("Expected buyer activation amount: 1060", async() => {
      let val = await instance.getBuyerActivationAmount();
      let _bool = val.eq(BigNumber(1060).times(scalar));
      assert.strictEqual(_bool, true, "The buyer ativation fee does not match");
  })

  it("Expected buyer activation amount: 335", async() => {
      let val = await instance.getSellerActivationAmount();
      let _bool = val.eq(BigNumber(335).times(scalar));
      assert.strictEqual(_bool, true, "The seller ativation fee does not match");
  })

  it("Expected Seller Security deposits: 0 and 1000000", async() =>{
      let secDeposit = await eventToken.allowance(accounts[1], accounts[0]);
      let _bool = secDeposit.eq(0);
      assert.strictEqual(_bool, true, "The security deposit does not match");

      await eventToken.approve(accounts[0], 1000000*scalar, {from:accounts[1]});
      secDeposit = await eventToken.allowance(accounts[1], accounts[0]);
      _bool = secDeposit.eq(BigNumber(1000000).times(scalar));
      assert.strictEqual(_bool, true, "The security deposit does not match");

  })

  // Check state of event
  it("Expected Event State: NOTACIVE", async() =>{
      return instance.getEventState.call().then(function(state){
        assert.strictEqual(state.toNumber(), 0, "The event state does not match");
      })
  })

  // Change state of EventContract
  it("Expected contract to be shifted to active state preceded by state check by a single transaction for buyers and sellers", async() =>{
      let buyerActivationAmount = await instance.getBuyerActivationAmount();
      let sellerActivationAmount = await instance.getSellerActivationAmount();
      let buyer = await instance.getBuyer();
      let seller = await instance.getSeller();


      let _balanceInit1 = await eventToken.balanceOf.call(buyer);
      let _balanceInit2 = await eventToken.balanceOf.call(seller);
      let _balanceInit3 = await eventToken.balanceOf.call(instance.address);

      await eventToken.approve(instance.address, buyerActivationAmount, {from: accounts[2]});
      await eventToken.approve(instance.address, sellerActivationAmount, {from: accounts[1]});

      await eventToken.transferToContract(instance.address, buyerActivationAmount, ["0x12"], {from: accounts[2]});
      await eventToken.transferToContract(instance.address, sellerActivationAmount, ["0x13"], {from:accounts[1]});

      let _balanceFinal1 = await eventToken.balanceOf.call(buyer);
      let _balanceFinal2 = await eventToken.balanceOf.call(seller);
      let _balanceFinal3 = await eventToken.balanceOf.call(instance.address);

      let _bool1 = _balanceFinal1.eq(_balanceInit1.minus(buyerActivationAmount));
      let _bool2 = _balanceFinal2.eq(_balanceInit2.minus(sellerActivationAmount));
      let _bool3 = _balanceFinal3.eq(_balanceInit3.add(buyerActivationAmount).add(sellerActivationAmount));

      assert.strictEqual(_bool1, true, "The buyer balances do not match");
      assert.strictEqual(_bool2, true, "The seller balances do not match");
      assert.strictEqual(_bool3, true, "The contract balances do not match");

      return instance.getEventState.call().then(function(state){
        assert.strictEqual(state.toNumber(), 1, "The event state does not match");
      })
  })

  it("Expected contract to be shifted to active state preceded by state check by a two transactions for buyers and sellers", async() =>{
      let buyerActivationAmount = await instance.getBuyerActivationAmount();
      let sellerActivationAmount = await instance.getSellerActivationAmount();
      let buyer = await instance.getBuyer();
      let seller = await instance.getSeller();

      let buyerDownPayment = buyerActivationAmount.minus(500);
      let sellerDownPayment = sellerActivationAmount.minus(300);

      let _balanceInit1 = await eventToken.balanceOf.call(buyer);
      let _balanceInit2 = await eventToken.balanceOf.call(seller);
      let _balanceInit3 = await eventToken.balanceOf.call(instance.address);

      //First half payment transfer
      await eventToken.approve(instance.address, buyerDownPayment, {from: accounts[2]});
      await eventToken.approve(instance.address, sellerDownPayment, {from: accounts[1]});

      await eventToken.transferToContract(instance.address, buyerDownPayment, ["0x12"], {from: accounts[2]});
      await eventToken.transferToContract(instance.address, sellerDownPayment, ["0x13"], {from:accounts[1]});

      //Second payment transfer
      await eventToken.approve(instance.address, buyerActivationAmount.minus(buyerDownPayment), {from: accounts[2]});
      await eventToken.approve(instance.address, sellerActivationAmount.minus(sellerDownPayment), {from: accounts[1]});

      await eventToken.transferToContract(instance.address, buyerActivationAmount.minus(buyerDownPayment), ["0x12"], {from: accounts[2]});
      await eventToken.transferToContract(instance.address, sellerActivationAmount.minus(sellerDownPayment), ["0x13"], {from:accounts[1]});

      let _balanceFinal1 = await eventToken.balanceOf.call(buyer);
      let _balanceFinal2 = await eventToken.balanceOf.call(seller);
      let _balanceFinal3 = await eventToken.balanceOf.call(instance.address);

      let _bool1 = _balanceFinal1.eq(_balanceInit1.minus(buyerActivationAmount));
      let _bool2 = _balanceFinal2.eq(_balanceInit2.minus(sellerActivationAmount));
      let _bool3 = _balanceFinal3.eq(_balanceInit3.add(buyerActivationAmount).add(sellerActivationAmount));

      assert.strictEqual(_bool1, true, "The buyer balances do not match");
      assert.strictEqual(_bool2, true, "The seller balances do not match");
      assert.strictEqual(_bool3, true, "The contract balances do not match");

      return instance.getEventState.call().then(function(state){
        assert.strictEqual(state.toNumber(), 1, "The event state does not match");
      })
  })











})
