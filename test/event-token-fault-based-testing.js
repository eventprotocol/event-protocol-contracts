var EventToken = artifacts.require("./EventToken.sol");
var BigNumber = require('bignumber.js');

import assertRevert from './helpers/assertRevert';

contract('Event Token Fault Based Testing', async (accounts) => {
  let instance;

  //create new smart contract instance before each test method
  beforeEach(async function(){
      instance = await EventToken.new(accounts[1], {from: accounts[0]});
  })

  it("Test 1: Expected Transaction Revert: Approval for values larger than MAX LIMIT allowed", async() => {
      await assertRevert(instance.approve(accounts[1], Math.pow(2,256) , {from:accounts[0]}));
  })

  it("Test 2: Expected Transaction Revert: Approval for negative values ", async() => {
      await assertRevert(instance.approve(accounts[1], -1 , {from:accounts[0]}));
  })

  it("Test 3: Expected Transaction Revert: Approval for 0", async() =>{
      await assertRevert(instance.approve(accounts[1], 0, {from: accounts[0]}));
  })

  it("Test 4: Expected Transaction Revert: Approval for address 0", async() =>{
      const ADDRESS_0 = '0x0000000000000000000000000000000000000000';
      await assertRevert(instance.approve(ADDRESS_0 , 1, {from:accounts[0]}));
  })

  it("Test 5: Expected Transaction Revert: Change Controller 1 address from Account 1 and Account 2", async() =>{
      await assertRevert(instance.setCtrlAddress1(accounts[1], {from:accounts[1]}));
      await assertRevert(instance.setCtrlAddress1(accounts[2], {from:accounts[2]}));
  })

  it("Test 6: Expected Transaction Revert: Change Controller 2 address from Account 0 and Account 2", async() =>{
      await assertRevert(instance.setCtrlAddress2(accounts[0], {from:accounts[0]}));
      await assertRevert(instance.setCtrlAddress2(accounts[2], {from:accounts[2]}));
  })

  it("Test 7: Expected Transaction Revert followed by state check: Pause contract from a non controller address", async() =>{
      await assertRevert(instance.pause({from:accounts[2]}));
      await assertRevert(instance.pause({from:accounts[9]}));
      let _bool = await instance.isActive();
      assert.strictEqual(_bool, true, "The contract state does not match");
  })

  it("Test 8: Expected Transaction Revert followed by state check: Resume contract from a non controller address", async() =>{
      await instance.pause({from:accounts[0]});
      await assertRevert(instance.resume({from:accounts[2]}));
      await assertRevert(instance.resume({from:accounts[9]}));
      let _bool = await instance.isActive();
      assert.strictEqual(_bool, false, "The contract state does not match");
  })

  it("Test 9: Expected Transaction Revert followed by a state check: Pause contract that is already paused", async() => {
      await instance.pause({from: accounts[0]});
      await assertRevert(instance.pause({from:accounts[0]}));
      let _bool = await instance.isActive();
      assert.strictEqual(_bool, false, "The contract state does not match");
  })

  it("Test 10: Expected Transaction Revert folllowed by state check: Approve from a paused contract", async() =>{
      await instance.pause({from: accounts[0]});
      let _amount = 1000*Math.pow(10,18);
      let _bool = await instance.isActive();
      await assertRevert(instance.approve(accounts[1], _amount, {from:accounts[0]}));
      await assertRevert(instance.transfer(accounts[1], _amount, {from:accounts[0]}));
      assert.strictEqual(_bool, false, "The contract state does not match");
  })






})
