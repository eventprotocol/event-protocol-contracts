pragma solidity ^0.4.24;

/// @title Interface for ERC223 Token Standard
/// @author keshik
/// @dev The contract declares the required functions and events to meet the ERC223 Standard
interface ERC223{
  function transfer(address _to, uint256 _value, bytes _data) public returns (bool);

  event Transfer(address _from, address _to, uint256 _value, bytes _data);
}
