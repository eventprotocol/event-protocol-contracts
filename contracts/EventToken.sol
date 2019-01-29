pragma solidity ^0.4.24;

/*************************************************
* Title: ERC20 Token
* Author: https://github.com/willitscale
* Date: NA
* Code version: NA
* Availability: https://github.com/willitscale/learning-solidity/blob/master/tutorial-10/MyFirstToken.sol
*************************************************/

/// @title Event Token (ET) implementation
/// @author keshik
/// @dev The contract declares the required functions, modifiers and events for the Event Token
import "./StandardToken.sol";
import "./ERC20.sol";
import "./ERC223.sol";
import "./EventContract.sol";

contract EventToken is StandardToken("EventToken", "ET", 18, 500000000), ERC20, ERC223{

  using SafeMath for uint256;
  address private _controller1;
  address private _controller2;
  bool private _paused;
  uint256 private _numberOfEvents;

  // MaxLimit of uint256
  uint256 constant MAX_LIMIT = 2**256 -1;

  // Mapping to store addresses and balances
  mapping (address => uint256) internal _balanceOf;

  // Nested Mapping to store allowances
  mapping (address => mapping (address => uint256)) internal _allowance;

  constructor (address _ctrl2) public{
    _controller1 = msg.sender;
    _controller2 = _ctrl2;
    _balanceOf[msg.sender] = _totalSupply;
    _paused = false;
    _numberOfEvents = 0;
  }

  modifier onlyCtrlLevel{
      require(msg.sender == _controller1 || msg.sender == _controller2);
      _;
  }

  modifier onlyCtrl1{
      require(msg.sender == _controller1);
      _;
  }

  modifier onlyCtrl2{
      require(msg.sender == _controller2);
      _;
  }

  modifier isPaused{
      require(_paused == true);
      _;
  }

  modifier isNotPaused{
      require(_paused == false);
      _;
  }

  /// @param _owner The address
  /// @return balance of the of the address
  function balanceOf(address _owner) public view returns (uint256){
      return _balanceOf[_owner];
  }

  /// @notice send `_value` token to `_to` from `msg.sender`
  /// @param _to The address of the recipient
  /// @param _value The amount of token to be transferred
  /// @return Whether the transfer was successful or not
  function transfer(address _to, uint256 _value) external isNotPaused returns (bool){
      require(_balanceOf[msg.sender] >= _value);
      require(_value > 0);
      require(_value < MAX_LIMIT);
      require(!isContract(_to));
      require(_to != address(0));
      require(_allowance[msg.sender][_to] >= _value);
      _balanceOf[msg.sender] = _balanceOf[msg.sender].sub(_value);
      _balanceOf[_to] = _balanceOf[_to].add(_value);
      _allowance[msg.sender][_to] = _allowance[msg.sender][_to].sub(_value);
      emit Transfer(msg.sender, _to, _value);
      return true;
  }

  /// @notice send `_value` token to `_to` from `msg.sender`
  /// @param _to The address of the recipient
  /// @param _value The amount of token to be transferred
  /// @param _contractId Event pointer
  /// @return Whether the transfer was successful or not
  function transferToContract(address _to, uint256 _value, uint _contractId) external isNotPaused returns (bool){
      require(_value > 0);
      require(_value < MAX_LIMIT);
      require(_balanceOf[msg.sender] >= _value);
      require(isContract(_to));
      require(_to != address(0));
      _balanceOf[msg.sender] = _balanceOf[msg.sender].sub(_value);
      _balanceOf[_to] = _balanceOf[_to].add(_value);
      _allowance[msg.sender][_to] = _allowance[msg.sender][_to].sub(_value);
      EventContract _contract = EventContract(_to);
      _contract.tokenFallback(msg.sender, _value, _contractId);
      emit Transfer(msg.sender, _to, _value, _contractId);
      return true;
  }

  /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
  /// @param _from The address of the sender
  /// @param _to The address of the recipient
  /// @param _value The amount of token to be transferred
  /// @return Whether the transfer was successful or not
  function transferFrom(address _from, address _to, uint256 _value) external isNotPaused returns (bool){
      require(_to != address(0));
      require(_balanceOf[_from] >= _value);
      require(_allowance[_from][msg.sender] >= _value);
      require(_value > 0);
      require(_value < MAX_LIMIT);
      _balanceOf[_from] = _balanceOf[_from].sub(_value);
      _balanceOf[_to] = _balanceOf[_to].add(_value);
      _allowance[_from][msg.sender] = _allowance[_from][msg.sender].sub(_value);
      emit Transfer(_from, _to, _value);
      return true;
  }

  /// @notice `msg.sender` approves `_spender` to spend `_value` tokens
  /// @param _spender The address of the account able to transfer the tokens
  /// @param _value The amount of tokens to be approved for transfer
  /// @return Whether the approval was successful or not
  function approve(address _spender, uint256 _value) external isNotPaused returns (bool){
      require(_value > 0);
      require(_value < MAX_LIMIT);
      require(_spender != address(0));
      _allowance[msg.sender][_spender] = _allowance[msg.sender][_spender].add(_value);
      emit Approval(msg.sender, _spender, _value);
      return true;
  }

  /// @param _owner The address of the account owning tokens
  /// @param _spender The address of the account able to transfer the tokens
  /// @return Amount of remaining tokens allowed to spent
  function allowance(address _owner, address _spender) public view returns (uint256){
      return _allowance[_owner][_spender];
  }

  /// @param _address The ethereum address to be verified
  /// @return Amount of remaining tokens allowed to spent
  function isContract(address _address) public view returns (bool){
      uint256 codeLength;
      assembly{
          codeLength := extcodesize(_address)
      }
      return codeLength > 0;
  }

  function getCtrlAddress1() public view returns (address){
      return _controller1;
  }

  function getCtrlAddress2() public view returns (address){
      return _controller2;
  }

  /// @notice change controller address 1. This function can only be called by the existing controller1
  /// @param _newCtrl1 The address of the new controller
  /// @return Whether the setter was successful or not
  function setCtrlAddress1(address _newCtrl1) external onlyCtrl1 returns (bool){
      require(_newCtrl1 != address(0));
      _controller1 = _newCtrl1;
      return true;
  }

  /// @notice change controller address 2. This function can only be called by the existing controller2
  /// @param _newCtrl2 The address of the new controller
  /// @return Whether the setter was successful or not
  function setCtrlAddress2(address _newCtrl2) external onlyCtrl2 returns (bool){
      require(_newCtrl2 != address(0));
      _controller2 = _newCtrl2;
      return true;
  }

  /// @notice Pause the contract. Can only be called by the controllers
  /// @return Whether the contract was successfully paused or not
  function pause() external onlyCtrlLevel isNotPaused returns (bool){
    _paused = true;
    return true;
  }

  /// @notice Resume the contract. Can only be called by the controllers
  /// @return Whether the contract was successfully resumed or not
  function resume() external onlyCtrlLevel isPaused returns (bool){
    _paused = false;
    return true;
  }

  /// @return Whether the contract is paused or not
  function isActive() external view returns (bool){
    return _paused == false;
  }

}
