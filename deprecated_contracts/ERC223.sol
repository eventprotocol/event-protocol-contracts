pragma solidity ^0.4.24;

/*************************************************
* Title: ERC223 Interface
* Author: https://github.com/willitscale
* Date: NA
* Code version: NA
* Availability: https://github.com/willitscale/learning-solidity/blob/master/tutorial-10/ERC223ReceivingContract.sol
*************************************************/

/// @title Interface for ERC223 Token Standard
/// @author keshik
/// @dev The contract declares the required functions and events to meet the ERC223 Standard
interface ERC223{
  function transferToContract(address _to, uint256 _value, bytes _data) external returns (bool);

  event Transfer(address _from, address _to, uint256 _value, bytes _data);
}
