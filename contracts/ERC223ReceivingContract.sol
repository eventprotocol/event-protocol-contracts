pragma solidity ^0.4.24;

/*************************************************
* Title: ERC223 Receiver Wrapper Contract
* Author: https://github.com/willitscale
* Date: NA
* Code version: NA
* Availability: https://github.com/willitscale/learning-solidity/blob/master/tutorial-10/ERC223ReceivingContract.sol
*************************************************/

/// @title Interface for ERC223 Receiving Contract
/// @author keshik
/// @dev The contract is a wrapper for ERC223 contracts which recieve funds
interface ERC223ReceivingContract {
    function tokenFallback(address _from, uint _value, bytes _data) external;
}
