
var EventToken = artifacts.require("./EventToken.sol");
var BigNumber = require('bignumber.js');

contract('Event Token Unit Testing', async (accounts) => {
  let instance;

  //create new smart contract instance before each test method
  beforeEach(async function(){
      instance = await EventToken.new(accounts[1], {from: accounts[0]});
  })

  it("Test 1: Expected total supply of tokens: 5000000", async() => {
      return instance.totalSupply.call().then(function(totalSupply) {
        assert.strictEqual(totalSupply.toNumber(), 500000000*Math.pow(10,18), "5000000 is not the total supply");
    })
  })

  it("Test 2: Expected name of the token is EventToken", async() => {
      return instance.name.call().then(function(name) {
        assert.strictEqual(name, "EventToken", "ChiromantToken is not the name of the token");
      })
  })

  it("Test 3: Expected symbol of the token is ET", async() => {
      return instance.symbol.call().then(function(symbol){
        assert.strictEqual(symbol, "ET", "ET is not the symbol of the token");
    })
  })

  it("Test 4: Expected decimels of the token is 18", async() => {
      return instance.decimels.call().then(function(decimels){
        assert.strictEqual(decimels.toNumber(), 18, "Number of decimels is not 18");
    })
  })

  it("Test 5: Expected balance of the " + accounts[0] + " is 5000000", async() => {
      return instance.balanceOf.call(accounts[0]).then(function(balance){
        assert.strictEqual(balance.toNumber(), 500000000*Math.pow(10,18), "Balance of accounts[0] is not 10000");
    })
  })

  it("Test 6: Expected Controller1 address is " + accounts[0], async() => {
      return instance.getCtrlAddress1.call().then(function(address){
        assert.strictEqual(address, accounts[0], "The controller-1 addresses do not match");
      })
  })

  it("Test 7: Expected Controller2 address is " + accounts[1], async() => {
      return instance.getCtrlAddress2.call().then(function(address){
        assert.strictEqual(address, accounts[1], "The controller-2 addresses do not match");
      })
  })

  it("Test 8: Input address is expected to be an account and not a contract " + accounts[1], async() => {
      return instance.isContract.call(accounts[0]).then(function(bool){
        assert.ok(!bool, "Account is interpreted as a contract");
      })
  })

  it("Test 9: Transfer 1000 tokens from accounts[0] to accounts[1] -> Transfer 500 tokens from accounts[1] to accounts[2]", async () => {
      let _balanceInit1 = await instance.balanceOf.call(accounts[0]);
      let _balanceInit2 = await instance.balanceOf.call(accounts[1]);
      let _amount = 1000*Math.pow(10,18);

      await instance.approve(accounts[1], _amount, {from : accounts[0]});
      await instance.transfer(accounts[1], _amount, {from: accounts[0]});

      let _balanceFinal1 = await instance.balanceOf.call(accounts[0]);
      let _balanceFinal2 = await instance.balanceOf.call(accounts[1]);

      assert.strictEqual(_balanceFinal1.toNumber(), BigNumber(_balanceInit1.toNumber()).minus(_amount).toNumber(), "The balances of transferer does not match");
      assert.strictEqual(_balanceFinal2.toNumber(), BigNumber(_balanceInit2.toNumber()).plus(_amount).toNumber(), "The balances of transferee does not match");


      _balanceInit1 = await instance.balanceOf.call(accounts[1]);
      _balanceInit2 = await instance.balanceOf.call(accounts[2]);
      _amount = 500*Math.pow(10,18);

      await instance.approve(accounts[2], _amount, {from: accounts[1]});
      await instance.transfer(accounts[2], _amount, {from: accounts[1]});

      _balanceFinal1 = await instance.balanceOf.call(accounts[1]);
      _balanceFinal2 = await instance.balanceOf.call(accounts[2]);

      assert.strictEqual(_balanceFinal1.toNumber(), BigNumber(_balanceInit1.toNumber()).minus(_amount).toNumber(), "The balances of transferer does not match");
      assert.strictEqual(_balanceFinal2.toNumber(), BigNumber(_balanceInit2.toNumber()).plus(_amount).toNumber(), "The balances of transferee does not match");
  })

  it("Test 10: Expected allowances should be 1000 and 2000", async() => {
      let _amount1 = 1000*Math.pow(10,18);
      let _amount2 = 1000*Math.pow(10,18);
      await instance.approve(accounts[1], _amount1, {from : accounts[0]});
      await instance.approve(accounts[2], _amount2, {from : accounts[1]});
      let allowance1 = await instance.allowance(accounts[0], accounts[1]);
      let allowance2 = await instance.allowance(accounts[1], accounts[2]);

      assert.equal(allowance1.toNumber(), _amount1, "The allowances (1000 ET) for accounts[0] and accounts[1] do not match");
      assert.equal(allowance2.toNumber(), _amount2, "The allowances (2000 ET) for accounts[1] and accounts[2] do not match");

  })

  it("Test 11: Contract expected to be paused and resumed", async() => {
      await instance.pause({from:accounts[0]});
      let _bool = await instance.isActive();
      assert.strictEqual(_bool, false, "The contract state does not match(1)");

      await instance.resume({from:accounts[1]});
      _bool = await instance.isActive();
      assert.strictEqual(_bool, true, "The contract state does not match(1)");

  })

  it("Test 12: Expected to change the controller address 1 to account[3]", async() => {
      let _ctrl1 = await instance.getCtrlAddress1();
      assert.strictEqual(_ctrl1, accounts[0], "The controller address 1 does not match");
      await instance.setCtrlAddress1(accounts[3], {from:accounts[0]});
      _ctrl1 = await instance.getCtrlAddress1();
      assert.strictEqual(_ctrl1, accounts[3], "The controller address 1 does not match");
  })

  it("Test 13: Expected to change the controller address 2 to account[4]", async() => {
      let _ctrl1 = await instance.getCtrlAddress2();
      assert.strictEqual(_ctrl1, accounts[1], "The controller address 1 does not match");
      await instance.setCtrlAddress2(accounts[4], {from:accounts[1]});
      _ctrl1 = await instance.getCtrlAddress2();
      assert.strictEqual(_ctrl1, accounts[4], "The controller address 2 does not match");
  })

  it("Test 14: Expected event count to be 0", async() => {
      return instance.getEventCount.call().then(function(count){
        assert.strictEqual(count.toNumber(), 0, "The event count does not match");
      })
  })

  it("Test 15: Expected event count to be 2", async() => {
      await instance.incrementEventCount();
      await instance.incrementEventCount();
      return instance.getEventCount.call().then(function(count){
        assert.strictEqual(count.toNumber(), 2, "The event count does not match");
      })
  })

});
