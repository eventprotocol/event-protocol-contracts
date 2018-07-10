pragma solidity ^0.4.24;

/// @title Interface for ERC20 Token Standard
/// @author keshik
/// @dev The contract declares the required functions and events to meet the ERC20 Standard
interface ERC20{
  function approve(address _spender, uint256 _value) external returns (bool);
  function allowance(address _owner, address _spender) external view returns (uint256);
  function balanceOf(address _owner) external view returns (uint256);
  function transfer(address _to, uint256 _value) external returns (bool);
  function transferFrom(address _from, address _to, uint256 _value) external returns (bool);

  event Transfer(address _from, address _to, uint256 _value);
  event Approval(address _from, address _to, uint256 _value);
}
